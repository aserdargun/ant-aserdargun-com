import { LabControlButton } from '@aserdargun/lab-ui';
import { manifest } from '../ils/catalog';
import { useRef, useState } from 'react';
import { Pause, Play, StepForward, RotateCcw, Download, Upload } from 'lucide-react';
import type { WorkerCommand, RunnerStatus, Speed } from '../worker/protocol';
import type { Copy } from './i18n';
import { TermHelp } from './TermHelp';
import { MAX_RUN_TICKS } from '../experiments/run';

interface Props {
  language: 'en' | 'tr';
  status: RunnerStatus;
  tick: number;
  copy: Copy;
  send: (command: WorkerCommand) => void;
  onReset: () => void;
  onError: (message: string) => void;
}
export function Controls({ language, status, tick, copy: t, send, onReset, onError }: Props) {
  const [ticks, setTicks] = useState('1800');
  const fileInput = useRef<HTMLInputElement>(null);
  const fileRead = useRef(0);
  const active = status.playing || status.remainingTicks > 0;
  const remaining = MAX_RUN_TICKS - tick;
  return (
    <div className="controls">
      <div className="transport">
        <LabControlButton
          action={active ? 'pause' : 'play'}
          capabilities={manifest.capabilities}
          locale={language}
          className="play-control"
          aria-label={active ? t.pause : t.play}
          disabled={!active && remaining === 0}
          onClick={() => send({ type: 'play', playing: !active })}
        >
          {active ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          {active ? t.pause : t.play}
        </LabControlButton>
        <LabControlButton
          action="step"
          aria-label={t.step}
          capabilities={manifest.capabilities}
          locale={language}
          disabled={remaining === 0}
          onClick={() => send({ type: 'step' })}
        >
          <StepForward />
          {t.step}
        </LabControlButton>
        <div className="speeds" role="group" aria-label={t.speed}>
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
        <LabControlButton
          action="reset"
          capabilities={manifest.capabilities}
          locale={language}
          onClick={onReset}
        >
          <RotateCcw />
          <span>{t.reset}</span>
        </LabControlButton>
        <span className="tick-count">
          <span className="term-label">
            {t.tick}
            <TermHelp term="tick" label={t.tick} />
          </span>
          <strong data-testid="tick">{tick.toLocaleString(t.locale)}</strong>
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
        <form
          className="run-form"
          onSubmit={(event) => {
            event.preventDefault();
            const requested = Number(ticks);
            if (!Number.isSafeInteger(requested) || requested < 1 || requested > remaining) {
              onError(t.tickError);
              return;
            }
            send({ type: 'run', ticks: requested });
          }}
        >
          <label htmlFor="run-ticks">{t.runTicks}</label>
          <input
            id="run-ticks"
            type="number"
            min="1"
            max={Math.max(1, remaining)}
            required
            disabled={remaining === 0}
            aria-describedby="run-budget"
            step="1"
            value={ticks}
            onChange={(e) => setTicks(e.target.value)}
          />
          <button type="submit" disabled={remaining === 0}>
            {t.execute}
          </button>
        </form>
        <p id="run-budget" className="fine-print">
          {t.availableTicks}: {remaining.toLocaleString(t.locale)}
        </p>
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
            const request = ++fileRead.current;
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (!file) return;
            if (file.size > 1000000) {
              onError(t.fileError);
              return;
            }
            try {
              const data: unknown = JSON.parse(await file.text());
              if (request === fileRead.current) send({ type: 'import', data });
            } catch {
              if (request === fileRead.current) onError(t.fileError);
            }
          }}
        />
      </details>
      {tick >= MAX_RUN_TICKS && <p role="status">{t.maxTicks}</p>}
    </div>
  );
}
