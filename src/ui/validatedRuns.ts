import raw from '../../docs/validation-evidence.json';

/**
 * The reviewed, seed-pinned evidence file written by `npm run evidence`.
 * Values are read from it, never retyped, so the page cannot drift from the file.
 */
export interface EvidenceRun {
  seed: number;
  signalGain: number;
  ticks: number;
  metrics: {
    delivered: number;
    coverage: number;
    firstDiscoveryTick: number;
    throughput: number;
  };
  trail: { connectedToFood: boolean };
  durationMs: number;
  ticksPerSecond: number;
}

export const evidence = {
  versions: raw.versions,
  runtime: raw.runtime,
  runs: raw.results as EvidenceRun[],
  tickBudget: raw.results[0].ticks as number,
};

/**
 * Publisher metadata and the available abstract/preview were checked on this date;
 * subscription-only full text was not used. docs/RESEARCH.md states the same date —
 * tests/evidence.test.ts fails if the two drift apart.
 */
export const researchReviewDate = '2026-09-06';
