import { Runner } from './runner';
import { VersionMismatchError } from '../experiments/run';
import type { WorkerRequest, WorkerUpdate } from './protocol';

const runner = new Runner();
let previous = performance.now(),
  lastPost = 0,
  lastMeasure = previous;
let credit = 0,
  measuredTicks = 0,
  ticksPerSecond = 0,
  batchMs = 0;
const emit = (update: WorkerUpdate) => postMessage(update);
let sequence = 0,
  inFlight: number | null = null,
  pending = false;
function publish() {
  pending = true;
  flush();
}
function flush() {
  // A slow or hidden view may retain one frame, never an unbounded queue of field copies.
  // Coalesce requests, then sample the latest state when that frame has been consumed.
  if (!pending || inFlight !== null) return;
  if (!runner.status.playing && runner.status.remainingTicks === 0) ticksPerSecond = 0;
  pending = false;
  inFlight = ++sequence;
  emit({
    type: 'snapshot',
    sequence,
    snapshot: runner.simulation.snapshot(),
    status: { ...runner.status },
    performance: { ticksPerSecond, batchMs },
  });
  lastPost = performance.now();
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try {
    if (event.data.type === 'ack') {
      if (event.data.sequence === inFlight) {
        inFlight = null;
        flush();
      }
      return;
    }
    const run = runner.command(event.data);
    credit = 0;
    previous = performance.now();
    if (!runner.status.playing && !runner.status.remainingTicks) {
      ticksPerSecond = 0;
      measuredTicks = 0;
      lastMeasure = previous;
    }
    if (run) emit({ type: 'export', run });
    publish();
  } catch (error) {
    emit({
      type: 'error',
      code:
        error instanceof VersionMismatchError
          ? 'versionError'
          : event.data.type === 'import'
            ? 'importError'
            : event.data.type === 'run'
              ? 'tickError'
              : 'commandError',
      message: error instanceof Error ? error.message : 'Simulation command failed.',
    });
  }
};

setInterval(() => {
  const now = performance.now();
  const elapsed = Math.min(250, now - previous);
  previous = now;
  const active = runner.status.playing || runner.status.remainingTicks > 0;
  if (!active) return;
  credit += (elapsed * 60 * runner.status.speed) / 1000;
  // Limit scheduling debt, not scientific steps; slow hosts report their achieved tick rate.
  credit = Math.min(credit, 240);
  const begin = performance.now();
  let stepped = 0;
  const wanted = runner.status.remainingTicks ? 120 : Math.min(120, Math.floor(credit));
  while (stepped < wanted && performance.now() - begin < 10) {
    const count = runner.advance(Math.min(4, wanted - stepped));
    if (!count) break;
    stepped += count;
  }
  batchMs = performance.now() - begin;
  credit = Math.max(0, credit - stepped);
  measuredTicks += stepped;
  if (now - lastMeasure >= 500) {
    ticksPerSecond = (measuredTicks / (now - lastMeasure)) * 1000;
    measuredTicks = 0;
    lastMeasure = now;
  }
  if (now - lastPost >= 32 || (!runner.status.playing && !runner.status.remainingTicks)) publish();
}, 8);
