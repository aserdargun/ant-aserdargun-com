import type { SimulationConfig } from '../simulation/types';
import { distance, permitted } from '../simulation/geometry';

export const DEFAULT_SEED = 58392041;
export const VERSIONS = {
  schema: 1,
  simulation: '0.1.0',
  brain: 'local-rule-1',
  world: 'first-trail-1',
  experiment: 'EXP-001@1',
  prng: 'mulberry32-1',
  math: 'portable-math-1',
} as const;

export function defaultConfig(seed = DEFAULT_SEED): SimulationConfig {
  return {
    seed,
    population: 100,
    world: {
      width: 960,
      height: 600,
      cellSize: 6,
      nest: { x: 170, y: 440, radius: 23, colonyId: 0 },
      foods: [{ id: 0, x: 770, y: 140, radius: 26, amount: 10000 }],
      obstacles: [
        { id: 0, x: 470, y: 275, radius: 42 },
        { id: 1, x: 520, y: 450, radius: 50 },
      ],
    },
    brain: { exploration: 0.18, sensorDistance: 22, speed: 2.5, signalGain: 1 },
    fields: {
      home: { deposit: 5, evaporation: 0.004, diffusion: 0.12, maximum: 100 },
      food: { deposit: 12, evaporation: 0.004, diffusion: 0.12, maximum: 100 },
    },
  };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object.');
  return value as Record<string, unknown>;
}
function number(value: unknown, name: string, min: number, max: number, integer = false): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  )
    throw new Error(`Invalid ${name}: expected ${min}–${max}${integer ? ' integer' : ''}.`);
  return value;
}

/** Rebuilds a bounded value; never accepts an arbitrary imported object as kernel config. */
export function parseConfig(input: unknown): SimulationConfig {
  const c = record(input),
    w = record(c.world),
    b = record(c.brain),
    fields = record(c.fields);
  const width = number(w.width, 'width', 120, 1920, true);
  const height = number(w.height, 'height', 120, 1200, true);
  const cellSize = number(w.cellSize, 'cell size', 4, 20, true);
  if (width % cellSize || height % cellSize)
    throw new Error('World dimensions must be multiples of cell size.');
  function circle(value: unknown) {
    const v = record(value);
    const result = {
      x: number(v.x, 'x', 0, width),
      y: number(v.y, 'y', 0, height),
      radius: number(v.radius, 'radius', 3, Math.min(width, height) / 3),
    };
    if (
      result.x - result.radius < 3 ||
      result.y - result.radius < 3 ||
      result.x + result.radius > width - 3 ||
      result.y + result.radius > height - 3
    )
      throw new Error('World entities must fit inside its bounds.');
    return result;
  }
  const n = record(w.nest);
  const nest = { ...circle(n), colonyId: number(n.colonyId, 'colony ID', 0, 0, true) };
  if (
    !Array.isArray(w.foods) ||
    w.foods.length < 1 ||
    w.foods.length > 8 ||
    !Array.isArray(w.obstacles) ||
    w.obstacles.length > 24
  )
    throw new Error('Expected 1–8 food sources and at most 24 obstacles.');
  const foods = w.foods.map((value) => {
    const f = record(value);
    return {
      ...circle(f),
      id: number(f.id, 'food ID', 0, 100, true),
      amount: number(f.amount, 'food amount', 1, 100000, true),
    };
  });
  const obstacles = w.obstacles.map((value) => {
    const o = record(value);
    return { ...circle(o), id: number(o.id, 'obstacle ID', 0, 100, true) };
  });
  if (
    new Set(foods.map((f) => f.id)).size !== foods.length ||
    new Set(obstacles.map((o) => o.id)).size !== obstacles.length
  )
    throw new Error('Entity IDs must be unique.');
  const world = { width, height, cellSize, nest, foods, obstacles };
  if (
    !permitted(nest, world, nest.radius + 3) ||
    foods.some(
      (f) => !permitted(f, world, f.radius + 3) || distance(f, nest) <= f.radius + nest.radius + 6,
    )
  )
    throw new Error('Nest and food must not overlap obstacles or one another.');
  for (let i = 0; i < foods.length; i++)
    for (let j = i + 1; j < foods.length; j++) {
      if (distance(foods[i], foods[j]) <= foods[i].radius + foods[j].radius)
        throw new Error('Food sources must not overlap.');
    }
  const field = (value: unknown) => {
    const f = record(value);
    return {
      deposit: number(f.deposit, 'deposit', 0, 50),
      evaporation: number(f.evaporation, 'evaporation', 0, 0.1),
      diffusion: number(f.diffusion, 'diffusion', 0, 0.24),
      maximum: number(f.maximum, 'maximum', 1, 1000),
    };
  };
  return {
    seed: number(c.seed, 'seed', 0, 0xffffffff, true),
    population: number(c.population, 'population', 1, 5000, true),
    world,
    brain: {
      exploration: number(b.exploration, 'exploration', 0, 1),
      sensorDistance: number(b.sensorDistance, 'sensor distance', 6, 60),
      speed: number(b.speed, 'speed', 0.5, 5),
      signalGain: number(b.signalGain, 'signal gain', 0, 5),
    },
    fields: { home: field(fields.home), food: field(fields.food) },
  };
}
