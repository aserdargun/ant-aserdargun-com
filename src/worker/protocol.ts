import type { SimulationConfig, SimulationSnapshot } from '../simulation/types';
import type { RunRecord } from '../experiments/run';

export type Speed = 1 | 5 | 20 | 100;
export type WorkerCommand =
  | { type: 'reset'; config: SimulationConfig; play: boolean }
  | { type: 'play'; playing: boolean }
  | { type: 'speed'; speed: Speed }
  | { type: 'step' }
  | { type: 'run'; ticks: number }
  | { type: 'import'; data: unknown }
  | { type: 'export' };
export type WorkerRequest = WorkerCommand | { type: 'ack'; sequence: number };
export interface RunnerStatus {
  playing: boolean;
  speed: Speed;
  remainingTicks: number;
}
export type WorkerUpdate =
  | {
      type: 'snapshot';
      sequence: number;
      snapshot: SimulationSnapshot;
      status: RunnerStatus;
      performance: { ticksPerSecond: number; batchMs: number };
    }
  | { type: 'export'; run: RunRecord }
  | { type: 'error'; message: string };
