import { parseConfig } from '../experiments/config';
import { makeRun } from '../experiments/run';
import { ChemicalField } from './field';
import { RuleBasedBrain } from './brain';
import type { AntBrain } from './brain';
import { SeededRandom } from './prng';
import { sin, cos, atan2, exp, wrapAngle } from './math';
import { bearing, clearSegment, distance } from './geometry';
import type {
  Ant,
  Colony,
  FoodSource,
  Metrics,
  MetricSample,
  Probe,
  SimulationConfig,
  SimulationEvent,
  SimulationSnapshot,
} from './types';

export class Simulation {
  private config!: SimulationConfig;
  private random!: SeededRandom;
  private ants!: Ant[];
  private colony!: Colony;
  private foods!: FoodSource[];
  private home!: ChemicalField;
  private food!: ChemicalField;
  private tick = 0;
  private visited!: Uint8Array;
  private visitedCount = 0;
  private freeCells = 0;
  private firstDiscoveryTick: number | null = null;
  private totalTripDistance = 0;
  private deliveryTicks: number[] = [];
  private events: SimulationEvent[] = [];
  private history: MetricSample[] = [];

  constructor(
    config: SimulationConfig,
    private readonly brain: AntBrain = new RuleBasedBrain(),
  ) {
    this.reset(config);
  }

  reset(config: SimulationConfig) {
    this.config = parseConfig(config);
    this.random = new SeededRandom(this.config.seed);
    const { world, population, fields } = this.config;
    this.colony = { id: world.nest.colonyId, population, delivered: 0 };
    this.foods = world.foods.map((f) => ({ ...f }));
    this.home = new ChemicalField(world, fields.home);
    this.food = new ChemicalField(world, fields.food);
    this.tick = 0;
    this.visited = new Uint8Array(this.home.values.length);
    this.visitedCount = 0;
    this.freeCells = this.home.blocked.reduce((sum, blocked) => sum + (blocked ? 0 : 1), 0);
    this.firstDiscoveryTick = null;
    this.totalTripDistance = 0;
    this.deliveryTicks = [];
    this.events = [];
    this.history = [{ tick: 0, delivered: 0 }];
    this.ants = Array.from({ length: population }, (_, id) => {
      const heading = wrapAngle(this.random.next() * Math.PI * 2);
      const radius = this.random.next() * world.nest.radius * 0.6;
      const dx = cos(heading) * radius,
        dy = sin(heading) * radius;
      return {
        id,
        colonyId: this.colony.id,
        x: world.nest.x + dx,
        y: world.nest.y + dy,
        heading,
        state: 'searching',
        carryingFood: false,
        tripDistance: 0,
        distanceSinceSource: 0,
        homeVector: { x: -dx, y: -dy },
        dwellTicks: 0,
        sensors: [],
        decision: 'explore',
      };
    });
  }

  private record(type: SimulationEvent['type'], antId: number) {
    this.events.push({ tick: this.tick, type, antId });
    if (this.events.length > 256) this.events.shift();
  }

  private sense(ant: Ant): { probes: Probe[]; targetBearing: number | null } {
    const { world, brain } = this.config;
    const probes = [-0.55, 0, 0.55].map((offset) => {
      const angle = ant.heading + offset;
      const p = {
        x: ant.x + cos(angle) * brain.sensorDistance,
        y: ant.y + sin(angle) * brain.sensorDistance,
      };
      const blocked = !clearSegment(ant, p, world);
      return {
        angle,
        blocked,
        food: blocked ? 0 : this.food.sample(p.x, p.y),
        home: blocked ? 0 : this.home.sample(p.x, p.y),
      };
    });
    // World lookup stays in the environment. Only detectable local bearings reach the brain.
    let targetBearing: number | null = null;
    if (ant.state === 'searching') {
      const nearby = this.foods.find(
        (f) =>
          f.amount > 0 &&
          distance(ant, f) <= f.radius + brain.sensorDistance &&
          clearSegment(ant, f, world),
      );
      if (nearby) targetBearing = bearing(ant, nearby);
    } else if (
      distance(ant, world.nest) <= world.nest.radius + brain.sensorDistance &&
      clearSegment(ant, world.nest, world)
    ) {
      targetBearing = bearing(ant, world.nest);
    }
    return { probes, targetBearing };
  }

  step(): void {
    this.tick++;
    const { world, brain, fields } = this.config;
    for (const ant of this.ants) {
      const sensed = this.sense(ant);
      ant.sensors = sensed.probes;
      const action = this.brain.decide(
        {
          ...sensed,
          heading: ant.heading,
          state: ant.state,
          homeBearing: atan2(ant.homeVector.y, ant.homeVector.x),
          exploration: brain.exploration,
          signalGain: brain.signalGain,
        },
        this.random,
      );
      ant.heading = action.heading;
      ant.decision = action.reason;
      const next = {
        x: ant.x + cos(ant.heading) * brain.speed,
        y: ant.y + sin(ant.heading) * brain.speed,
      };
      if (clearSegment(ant, next, world)) {
        ant.homeVector.x -= next.x - ant.x;
        ant.homeVector.y -= next.y - ant.y;
        ant.x = next.x;
        ant.y = next.y;
        ant.tripDistance += brain.speed;
        ant.distanceSinceSource += brain.speed;
      } else {
        ant.heading += Math.PI * 0.55;
        ant.decision = 'avoid';
      }
      ant.dwellTicks++;
      const cell = this.home.index(ant.x, ant.y);
      if (!this.home.blocked[cell] && !this.visited[cell]) {
        this.visited[cell] = 1;
        this.visitedCount++;
      }

      if (ant.state === 'searching') {
        this.home.deposit(ant.x, ant.y, fields.home.deposit * exp(-ant.distanceSinceSource / 400));
        const source = this.foods.find((f) => f.amount > 0 && distance(ant, f) <= f.radius);
        if (source) {
          source.amount--;
          ant.state = 'returning';
          ant.carryingFood = true;
          ant.dwellTicks = 0;
          ant.distanceSinceSource = 0;
          ant.heading += Math.PI;
          if (this.firstDiscoveryTick === null) {
            this.firstDiscoveryTick = this.tick;
            this.record('discovery', ant.id);
          }
          this.record('pickup', ant.id);
        }
      } else {
        this.food.deposit(ant.x, ant.y, fields.food.deposit * exp(-ant.distanceSinceSource / 650));
        if (distance(ant, world.nest) <= world.nest.radius) {
          this.colony.delivered++;
          this.totalTripDistance += ant.tripDistance;
          this.deliveryTicks.push(this.tick);
          this.record('delivery', ant.id);
          ant.state = 'searching';
          ant.carryingFood = false;
          ant.dwellTicks = 0;
          ant.tripDistance = 0;
          ant.distanceSinceSource = 0;
          ant.heading += Math.PI;
          // Nest contact recalibrates the proprioceptive displacement.
          ant.homeVector = { x: world.nest.x - ant.x, y: world.nest.y - ant.y };
        }
      }
      ant.heading = wrapAngle(ant.heading);
    }
    this.home.update();
    this.food.update();
    while (this.deliveryTicks.length && this.deliveryTicks[0] <= this.tick - 1000)
      this.deliveryTicks.shift();
    if (this.tick % 30 === 0) {
      this.history.push({ tick: this.tick, delivered: this.colony.delivered });
      if (this.history.length > 600) this.history.shift();
    }
  }

  stepMany(ticks: number): void {
    if (!Number.isSafeInteger(ticks) || ticks < 0 || ticks > 1000000)
      throw new Error('Tick count must be an integer from 0 to 1,000,000.');
    for (let i = 0; i < ticks; i++) this.step();
  }

  metrics(): Metrics {
    const returning = this.ants.reduce((sum, a) => sum + (a.carryingFood ? 1 : 0), 0);
    return {
      tick: this.tick,
      delivered: this.colony.delivered,
      returning,
      searching: this.colony.population - returning,
      remaining: this.foods.reduce((sum, f) => sum + f.amount, 0),
      coverage: (this.visitedCount / this.freeCells) * 100,
      firstDiscoveryTick: this.firstDiscoveryTick,
      meanTripDistance: this.colony.delivered
        ? this.totalTripDistance / this.colony.delivered
        : null,
      throughput: this.tick ? (this.deliveryTicks.length / Math.min(1000, this.tick)) * 1000 : 0,
      foodSignalMass: this.food.mass(),
    };
  }

  snapshot(): SimulationSnapshot {
    return {
      tick: this.tick,
      randomState: this.random.state,
      config: parseConfig(this.config),
      colony: { ...this.colony },
      ants: this.ants.map((a) => ({
        ...a,
        homeVector: { ...a.homeVector },
        sensors: a.sensors.map((p) => ({ ...p })),
      })),
      foods: this.foods.map((f) => ({ ...f })),
      fields: {
        columns: this.home.columns,
        rows: this.home.rows,
        home: this.home.values.slice(),
        food: this.food.values.slice(),
      },
      metrics: this.metrics(),
      events: this.events.map((e) => ({ ...e })),
      history: this.history.map((h) => ({ ...h })),
      visited: this.visited.slice(),
      totalTripDistance: this.totalTripDistance,
      deliveryTicks: [...this.deliveryTicks],
    };
  }

  exportRun() {
    return makeRun(this.snapshot());
  }
  get tickCount() {
    return this.tick;
  }
}
