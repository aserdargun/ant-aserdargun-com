import { parseConfig, VERSIONS } from './config';
import type {
  Metrics,
  SimulationConfig,
  SimulationEvent,
  SimulationSnapshot,
} from '../simulation/types';

export const MAX_RUN_TICKS = 100000;
export class VersionMismatchError extends Error {}
export interface RunRecord {
  versions: typeof VERSIONS;
  config: SimulationConfig;
  tickCount: number;
  metrics: Metrics;
  events: SimulationEvent[];
}

export function makeRun(snapshot: SimulationSnapshot): RunRecord {
  if (snapshot.tick > MAX_RUN_TICKS)
    throw new Error(`Export supports at most ${MAX_RUN_TICKS} ticks.`);
  return {
    versions: { ...VERSIONS },
    config: parseConfig(snapshot.config),
    tickCount: snapshot.tick,
    metrics: { ...snapshot.metrics },
    events: snapshot.events.map((e) => ({ ...e })),
  };
}

/** Only replay inputs are trusted; imported outcome assertions are recomputed by the kernel. */
export function parseRun(input: unknown): { config: SimulationConfig; tickCount: number } {
  if (!input || typeof input !== 'object') throw new Error('Invalid run file.');
  const r = input as Record<string, unknown>;
  const versions = r.versions as Record<string, unknown> | undefined;
  if (!versions || Object.entries(VERSIONS).some(([key, value]) => versions[key] !== value))
    throw new VersionMismatchError('This run uses an unsupported model version.');
  if (
    !Number.isSafeInteger(r.tickCount) ||
    (r.tickCount as number) < 0 ||
    (r.tickCount as number) > MAX_RUN_TICKS
  )
    throw new Error(`Replay supports 0–${MAX_RUN_TICKS} ticks.`);
  return { config: parseConfig(r.config), tickCount: r.tickCount as number };
}
