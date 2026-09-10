import { useCallback, useEffect, useRef, useState } from 'react';
import { SimulationClient } from '../worker/client';
import type { WorkerCommand, WorkerUpdate } from '../worker/protocol';
import { defaultConfig } from '../experiments/config';
import type { RunRecord } from '../experiments/run';
import { dictionary, type Language } from './i18n';

type SnapshotUpdate = Extract<WorkerUpdate, { type: 'snapshot' }>;
// Keep the immutable frame behind an accessor. React's development Performance Tracks
// recursively serialize changed props; passing the field arrays as props retains megabytes
// per render in the browser's timing buffer, even without an open performance recording.
type SnapshotFrame = Omit<SnapshotUpdate, 'snapshot'> & {
  readSnapshot: () => SnapshotUpdate['snapshot'];
};
export function useLaboratory(language: Language) {
  const client = useRef<SimulationClient | null>(null);
  const [update, setUpdate] = useState<SnapshotFrame | null>(null);
  const [error, setError] = useState<string | Extract<WorkerUpdate, { type: 'error' }>>('');
  const [exported, setExported] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let connection: SimulationClient;
    try {
      connection = new SimulationClient();
    } catch {
      setFailed(true);
      return;
    }
    client.current = connection;
    connection.subscribe((message) => {
      if (message.type === 'snapshot') {
        const { snapshot, ...metadata } = message;
        setUpdate({ ...metadata, readSnapshot: () => snapshot });
      } else if (message.type === 'error') {
        if (message.fatal) {
          setFailed(true);
          connection.dispose();
          client.current = null;
        } else setError(message);
      } else {
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
  }, [attempt]);
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
  const retry = useCallback(() => {
    setUpdate(null);
    setError('');
    setFailed(false);
    setAttempt((value) => value + 1);
  }, []);
  return {
    update,
    send,
    error: typeof error === 'string' ? error : dictionary[language][error.code ?? 'commandError'],
    setError,
    exported,
    failed,
    retry,
  };
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
