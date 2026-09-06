import { useCallback, useEffect, useRef, useState } from 'react';
import { SimulationClient } from '../worker/client';
import type { WorkerCommand, WorkerUpdate } from '../worker/protocol';
import { defaultConfig } from '../experiments/config';
import type { RunRecord } from '../experiments/run';

type SnapshotUpdate = Extract<WorkerUpdate, { type: 'snapshot' }>;
// Keep the immutable frame behind an accessor. React's development Performance Tracks
// recursively serialize changed props; passing the field arrays as props retains megabytes
// per render in the browser's timing buffer, even without an open performance recording.
type SnapshotFrame = Omit<SnapshotUpdate, 'snapshot'> & {
  readSnapshot: () => SnapshotUpdate['snapshot'];
};
export function useLaboratory() {
  const client = useRef<SimulationClient | null>(null);
  const [update, setUpdate] = useState<SnapshotFrame | null>(null);
  const [error, setError] = useState('');
  const [exported, setExported] = useState(0);
  useEffect(() => {
    const connection = new SimulationClient();
    client.current = connection;
    connection.subscribe((message) => {
      if (message.type === 'snapshot') {
        const { snapshot, ...metadata } = message;
        setUpdate({ ...metadata, readSnapshot: () => snapshot });
      } else if (message.type === 'error') setError(message.message);
      else {
        downloadRun(message.run);
        setExported((v) => v + 1);
      }
    });
    connection.send({
      type: 'reset',
      config: defaultConfig(),
      play: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
    return () => {
      connection.dispose();
      client.current = null;
    };
  }, []);
  useEffect(() => {
    if (!update) return;
    const connection = client.current;
    // Acknowledge after React commits and the browser can draw. Background tabs stop
    // requesting frames while the deterministic worker continues its run independently.
    const frame = requestAnimationFrame(() =>
      connection?.send({ type: 'ack', sequence: update.sequence }),
    );
    return () => cancelAnimationFrame(frame);
  }, [update]);
  const send = useCallback((command: WorkerCommand) => {
    setError('');
    client.current?.send(command);
  }, []);
  return { update, send, error, setError, exported };
}

function downloadRun(run: RunRecord) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `ant-${run.config.seed}-tick-${run.tickCount}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
