import { useRef, useState } from 'react';
import { Pause, Play, StepForward, RotateCcw, Download, Upload } from 'lucide-react';
import type { WorkerCommand, RunnerStatus, Speed } from '../worker/protocol';
import type { Copy } from './i18n';
import { TermHelp } from './TermHelp';

interface Props {
  status: RunnerStatus;
  tick: number;
  copy: Copy;
  send: (command: WorkerCommand) => void;
  onReset: () => void;
  onError: (message: string) => void;
}
export function Controls({ status, tick, copy: t, send, onReset, onError }: Props) {
  const [ticks, setTicks] = useState('1800');
  const fileInput = useRef<HTMLInputElement>(null);
  const active = status.playing || status.remainingTicks > 0;
  return (
    <div className="controls">
      <div className="transport">
        <button
          className="play-control"
          aria-label={active ? t.pause : t.play}
          onClick={() => send({ type: 'play', playing: !active })}
        >
          {active ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          {active ? t.pause : t.play}
        </button>
        <button onClick={() => send({ type: 'step' })}>
          <StepForward />
          {t.step}
        </button>
        <div className="speeds" role="group" aria-label="Speed">
          {([1, 5, 20, 100] as Speed[]).map((speed) => (
            <button
              aria-pressed={status.speed === speed}
              key={speed}
              onClick={() => send({ type: 'speed', speed })}
            >
              {speed}×
            </button>
          ))}
        </div>
        <button onClick={onReset}>
          <RotateCcw />
          <span>{t.reset}</span>
        </button>
        <span className="tick-count">
          <span className="term-label">
            {t.tick}
            <TermHelp term="tick" label={t.tick} />
          </span>
          <strong data-testid="tick">{tick.toLocaleString('en-US')}</strong>
        </span>
      </div>
      <details className="run-tools">
        <summary>
          {t.advanced}
          <span>
            {status.remainingTicks > 0
              ? `${t.replaying} · ${status.remainingTicks}`
              : `${status.playing ? t.tick : t.completed} ${tick}`}
          </span>
        </summary>
        <p className="fine-print">{t.speedNote}</p>
        <TermHelp term="replay" showLabel />
        <div className="run-form">
          <label htmlFor="run-ticks">{t.runTicks}</label>
          <input
            id="run-ticks"
            type="number"
            min="1"
            max="100000"
            step="1"
            value={ticks}
            onChange={(e) => setTicks(e.target.value)}
          />
          <button onClick={() => send({ type: 'run', ticks: Number(ticks) })}>{t.execute}</button>
        </div>
        <div className="file-actions">
          <button onClick={() => send({ type: 'export' })}>
            <Download />
            {t.export}
          </button>
          <button onClick={() => fileInput.current?.click()}>
            <Upload />
            {t.import}
          </button>
        </div>
        <input
          ref={fileInput}
          className="file-input"
          type="file"
          accept=".json,application/json"
          aria-label={t.import}
          onChange={async (e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (!file) return;
            if (file.size > 1000000) {
              onError(t.fileError);
              return;
            }
            try {
              send({ type: 'import', data: JSON.parse(await file.text()) });
            } catch {
              onError(t.fileError);
            }
          }}
        />
      </details>
      {tick >= 100000 && <p role="status">{t.maxTicks}</p>}
    </div>
  );
}
