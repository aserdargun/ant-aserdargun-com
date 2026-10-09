import { expect, it } from 'vitest';
import { Simulation } from '../src/simulation/simulation';
import { defaultConfig, VERSIONS } from '../src/experiments/config';
import { analyzeTrail } from '../src/experiments/trail-analysis';
import raw from '../docs/validation-evidence.json';

/**
 * The published evidence table is a measurement, so it has to be reproducible.
 *
 * `docs/validation-evidence.json` is the source the interface renders, and
 * `scripts/evidence.ts` is what produced it — but that script writes to
 * `.local/evidence.json` and never runs in CI, so nothing compared the two. The
 * existing evidence test could only compare the file against the wrapper that
 * reads it, which proves the numbers were not retyped, not that they are right.
 *
 * That left the one number a reader can actually check free to drift: change the
 * simulation and the page keeps publishing the old result, with a green build.
 * These rows are deterministic, so the comparison can simply be made here.
 *
 * Only the deterministic fields are compared. `durationMs` and `ticksPerSecond`
 * are wall-clock measurements of the machine that produced them, so pinning them
 * would fail on any slower runner and mean nothing scientifically.
 */

const SEEDS = [58392041, 7, 42] as const;
const GAINS = [1, 0] as const;
const TICKS = 6000;

/** The fields that are a property of the simulation rather than of the machine. */
const DETERMINISTIC_METRICS = [
  'delivered',
  'returning',
  'searching',
  'remaining',
  'coverage',
  'firstDiscoveryTick',
  'meanTripDistance',
  'throughput',
  'foodSignalMass',
  'tick',
] as const;

const DETERMINISTIC_TRAIL = [
  'threshold',
  'connectedToFood',
  'activeCells',
  'activeAreaFraction',
  'massFractionInActiveCells',
  'connectedCells',
] as const;

interface PinnedRun {
  seed: number;
  signalGain: number;
  ticks: number;
  metrics: Record<string, number>;
  trail: Record<string, number | boolean>;
}

const pinned = raw.results as unknown as PinnedRun[];

it('the published evidence rows are the ones the simulation still produces', () => {
  // Same seeds, gains and tick budget the evidence script uses.
  expect(pinned).toHaveLength(SEEDS.length * GAINS.length);

  let row = 0;
  for (const seed of SEEDS) {
    for (const signalGain of GAINS) {
      const config = defaultConfig(seed);
      config.brain.signalGain = signalGain;
      const colony = new Simulation(config);
      colony.stepMany(TICKS);

      const recorded = pinned[row]!;
      const label = `seed ${seed}, signalGain ${signalGain}`;
      row += 1;

      // The row must describe the run it claims to, before its numbers mean anything.
      expect(recorded.seed, `${label}: seed`).toBe(seed);
      expect(recorded.signalGain, `${label}: signalGain`).toBe(signalGain);
      expect(recorded.ticks, `${label}: ticks`).toBe(TICKS);

      const metrics = colony.metrics() as unknown as Record<string, number>;
      for (const key of DETERMINISTIC_METRICS) {
        expect(metrics[key], `${label}: metrics.${key} in the published evidence`).toBe(
          recorded.metrics[key],
        );
      }

      const trail = analyzeTrail(colony.snapshot()) as unknown as Record<string, number | boolean>;
      for (const key of DETERMINISTIC_TRAIL) {
        expect(trail[key], `${label}: trail.${key} in the published evidence`).toBe(
          recorded.trail[key],
        );
      }
    }
  }
}, 180000);

it('the published evidence names the simulation that produced it', () => {
  // A row pinned against one kernel and published under another is not evidence.
  // `emergence.test.ts` pins a snapshot hash for a single seed; this covers the
  // version banner every row is published under.
  expect(raw.versions).toEqual(VERSIONS);
});
