import { expect, it } from 'vitest';
import { Simulation } from '../src/simulation/simulation';
import { defaultConfig } from '../src/experiments/config';
import { analyzeTrail } from '../src/experiments/trail-analysis';
import { createHash } from 'node:crypto';

it('F: an unscripted reinforced corridor emerges across three fixed seeds', () => {
  for (const seed of [58392041, 7, 42]) {
    const config = defaultConfig(seed),
      colony = new Simulation(config);
    const blindConfig = defaultConfig(seed);
    blindConfig.brain.signalGain = 0;
    const blind = new Simulation(blindConfig);
    expect(analyzeTrail(colony.snapshot()).connectedToFood).toBe(false);
    colony.stepMany(6000);
    blind.stepMany(6000);
    const trail = analyzeTrail(colony.snapshot());
    expect(trail.connectedToFood).toBe(true);
    expect(trail.massFractionInActiveCells).toBeGreaterThan(0.7);
    expect(trail.activeAreaFraction).toBeLessThan(0.2);
    expect(colony.metrics().delivered).toBeGreaterThan(blind.metrics().delivered * 3);
    // The common stream matches before signaling influences any decision.
    expect(colony.metrics().firstDiscoveryTick).toBe(blind.metrics().firstDiscoveryTick);
    if (seed === 58392041) {
      expect(createHash('sha256').update(JSON.stringify(colony.snapshot())).digest('hex')).toBe(
        '64c9720504bb1f1ac97c3536f019d126cce54d85d11083bba9a7587395cc4e27',
      );
    }
  }
});
