import { mkdirSync, writeFileSync } from 'node:fs';
import { Simulation } from '../src/simulation/simulation';
import { defaultConfig, VERSIONS } from '../src/experiments/config';
import { analyzeTrail } from '../src/experiments/trail-analysis';

const results = [];
for (const seed of [58392041, 7, 42]) {
  for (const signalGain of [1, 0]) {
    const config = defaultConfig(seed);
    config.brain.signalGain = signalGain;
    const sim = new Simulation(config),
      begin = performance.now();
    sim.stepMany(6000);
    const durationMs = performance.now() - begin;
    const row = {
      seed,
      signalGain,
      ticks: 6000,
      metrics: sim.metrics(),
      trail: analyzeTrail(sim.snapshot()),
      durationMs,
      ticksPerSecond: 6000000 / durationMs,
    };
    results.push(row);
    console.log(JSON.stringify(row));
  }
}
const performanceResults = [];
for (const population of [100, 1000, 5000]) {
  const c = defaultConfig();
  c.population = population;
  const sim = new Simulation(c);
  sim.stepMany(100);
  const begin = performance.now();
  sim.stepMany(1000);
  performanceResults.push({ population, ticks: 1000, durationMs: performance.now() - begin });
}
mkdirSync('.local', { recursive: true });
writeFileSync(
  '.local/evidence.json',
  JSON.stringify(
    { versions: VERSIONS, runtime: process.version, results, performanceResults },
    null,
    2,
  ),
);
console.log(JSON.stringify({ performanceResults, report: '.local/evidence.json' }));
