import { describe, expect, it } from 'vitest';
import { Simulation } from '../src/simulation/simulation';
import { defaultConfig } from '../src/experiments/config';
import { permitted } from '../src/simulation/geometry';

describe('headless simulation scientific contracts', () => {
  it('A/G: exact repeatability, batching independence, seed sensitivity, no browser', () => {
    expect(typeof globalThis.document).toBe('undefined');
    const c = defaultConfig(),
      a = new Simulation(c),
      b = new Simulation(c);
    a.stepMany(1200);
    for (let i = 0; i < 12; i++) b.stepMany(100);
    expect(a.snapshot()).toEqual(b.snapshot());
    const different = new Simulation(defaultConfig(c.seed + 1));
    different.stepMany(1200);
    expect(different.snapshot().ants).not.toEqual(a.snapshot().ants);
    a.reset(c);
    a.stepMany(1200);
    expect(a.snapshot()).toEqual(b.snapshot());
  });
  it('B/C: locally discovers food, returns inventory and deposits food signal', () => {
    const c = defaultConfig(7);
    c.population = 1;
    c.world.foods = [{ id: 0, x: 210, y: 440, radius: 8, amount: 20 }];
    c.world.obstacles = [];
    const sim = new Simulation(c);
    sim.stepMany(3000);
    expect(sim.metrics().firstDiscoveryTick).not.toBeNull();
    expect(sim.metrics().delivered).toBeGreaterThan(0);
    expect(sim.metrics().foodSignalMass).toBeGreaterThan(0);
    expect(sim.snapshot().events.some((e) => e.type === 'delivery')).toBe(true);
  });
  it('preserves food, bounds, obstacle exclusion and finite fields', () => {
    const c = defaultConfig(),
      sim = new Simulation(c);
    for (let i = 0; i < 1600; i++) {
      sim.step();
      if (i % 20 !== 0) continue;
      const s = sim.snapshot();
      expect(s.ants.every((a) => permitted(a, c.world))).toBe(true);
      expect(s.metrics.remaining + s.metrics.returning + s.metrics.delivered).toBe(10000);
      expect(
        s.fields.food.every((v) => Number.isFinite(v) && v >= 0 && v <= c.fields.food.maximum),
      ).toBe(true);
    }
  });
  it('snapshots cannot mutate the kernel and empty metrics are explicit', () => {
    const sim = new Simulation(defaultConfig());
    expect(sim.metrics().meanTripDistance).toBeNull();
    expect(sim.metrics().firstDiscoveryTick).toBeNull();
    const snapshot = sim.snapshot();
    snapshot.ants[0].x = -100;
    snapshot.config.world.nest.x = -50;
    snapshot.fields.food[0] = 10;
    expect(sim.snapshot().ants[0].x).toBeGreaterThan(0);
    expect(sim.snapshot().config.world.nest.x).toBe(170);
    expect(sim.snapshot().fields.food[0]).toBe(0);
  });
});
