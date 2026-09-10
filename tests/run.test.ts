import { expect, it, vi } from 'vitest';
import { Simulation } from '../src/simulation/simulation';
import { defaultConfig, parseConfig } from '../src/experiments/config';
import { parseRun, makeRun } from '../src/experiments/run';
import { Runner } from '../src/worker/runner';
import { MAX_RUN_TICKS } from '../src/experiments/run';

it('rejected imports preserve scientific state and queued work', () => {
  const runner = new Runner();
  runner.command({ type: 'run', ticks: 100 });
  runner.advance(4);
  const before = runner.simulation.snapshot();
  const status = { ...runner.status };
  const record = runner.simulation.exportRun();
  record.config.population = -1;
  expect(() => runner.command({ type: 'import', data: record })).toThrow();
  expect(runner.simulation.snapshot()).toEqual(before);
  expect(runner.status).toEqual(status);
});

it('the tick ceiling cannot enter a phantom playing state or accept more work', () => {
  const runner = new Runner();
  vi.spyOn(runner.simulation, 'tickCount', 'get').mockReturnValue(MAX_RUN_TICKS);
  const step = vi.spyOn(runner.simulation, 'step');
  runner.command({ type: 'play', playing: true });
  expect(runner.status.playing).toBe(false);
  runner.command({ type: 'step' });
  expect(step).not.toHaveBeenCalled();
  expect(() => runner.command({ type: 'run', ticks: 1 })).toThrow('Run limit');
  expect(runner.advance(10)).toBe(0);
});

it('exported run reproduces all scientific state and rejects incompatible versions', () => {
  const sim = new Simulation(defaultConfig());
  sim.stepMany(900);
  const record = JSON.parse(JSON.stringify(sim.exportRun()));
  const run = parseRun(record),
    replay = new Simulation(run.config);
  replay.stepMany(run.tickCount);
  expect(replay.snapshot()).toEqual(sim.snapshot());
  record.versions.brain = 'unrecognized';
  expect(() => parseRun(record)).toThrow('unsupported');
});

it('validates configuration and import bounds before allocation or replay', () => {
  for (const seed of [-1, 0.4, NaN, 2 ** 32])
    expect(() => parseConfig({ ...defaultConfig(), seed })).toThrow();
  const c = defaultConfig();
  c.population = 1e9;
  expect(() => parseConfig(c)).toThrow();
  c.population = 100;
  c.world.obstacles.push({ id: 8, ...c.world.nest });
  expect(() => parseConfig(c)).toThrow();
  const record = new Simulation(defaultConfig()).exportRun();
  expect(() => parseRun({ ...record, tickCount: 100001 })).toThrow();
  expect(() => makeRun({ ...new Simulation(defaultConfig()).snapshot(), tick: 100001 })).toThrow();
});

it('finite runs stop at exact tick, pause cancels queued work, and reset cancels replay', () => {
  const r = new Runner();
  r.command({ type: 'run', ticks: 125 });
  r.advance(100);
  r.advance(100);
  expect(r.simulation.metrics().tick).toBe(125);
  expect(r.advance(100)).toBe(0);
  r.command({ type: 'run', ticks: 100 });
  r.advance(4);
  r.command({ type: 'play', playing: false });
  expect(r.advance(50)).toBe(0);
  r.command({ type: 'step' });
  expect(r.simulation.metrics().tick).toBe(130);
  r.command({ type: 'import', data: r.simulation.exportRun() });
  expect(r.status.remainingTicks).toBe(130);
  r.command({ type: 'reset', config: defaultConfig(), play: false });
  expect(r.status.remainingTicks).toBe(0);
  expect(r.simulation.metrics().tick).toBe(0);
  expect(() => r.command({ type: 'run', ticks: -10 })).toThrow();
});
