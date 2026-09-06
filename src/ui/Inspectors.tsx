import type { SimulationSnapshot } from '../simulation/types';
import type { Copy, Language } from './i18n';
import { decisionLabels } from './i18n';
import { Crosshair } from 'lucide-react';

interface Props {
  readSnapshot: () => SimulationSnapshot;
  copy: Copy;
  language: Language;
  selected: number | null;
  onSelect: (id: number | null) => void;
  follow: boolean;
  setFollow: (v: boolean) => void;
  sensors: boolean;
  setSensors: (v: boolean) => void;
  performance: { ticksPerSecond: number; batchMs: number };
}
export function Inspectors({
  readSnapshot,
  copy: t,
  language,
  selected,
  onSelect,
  follow,
  setFollow,
  sensors,
  setSensors,
  performance,
}: Props) {
  const s = readSnapshot();
  const population = s.ants.length;
  const antOptions = useMemo(
    () =>
      Array.from({ length: population }, (_, id) => (
        <option key={id} value={id}>
          ANT #{id + 1}
        </option>
      )),
    [population],
  );
  const m = s.metrics,
    ant = selected === null ? undefined : s.ants[selected];
  const history = [...s.history];
  if (history.at(-1)?.tick !== s.tick) history.push({ tick: s.tick, delivered: m.delivered });
  const first = history[0].tick,
    end = Math.max(first + 1, s.tick),
    max = Math.max(1, m.delivered);
  const path = history
    .map(
      (p, i) =>
        `${i ? 'L' : 'M'}${26 + ((p.tick - first) / (end - first)) * 204},${114 - (p.delivered / max) * 100}`,
    )
    .join(' ');
  return (
    <aside className="colony-rail">
      <h2>{t.colony}</h2>
      <dl className="colony-metrics">
        <div>
          <dt>{t.delivered}</dt>
          <dd data-testid="delivered">{m.delivered}</dd>
        </div>
        <div>
          <dt>{t.returning}</dt>
          <dd>
            {m.returning}
            <small> / {s.colony.population}</small>
          </dd>
        </div>
        <div>
          <dt>{t.coverage}</dt>
          <dd>
            {m.coverage.toFixed(0)}
            <small>%</small>
          </dd>
        </div>
        <div>
          <dt>{t.discovery}</dt>
          <dd>
            {m.firstDiscoveryTick === null ? (
              <small>{t.awaiting}</small>
            ) : (
              <>
                {m.firstDiscoveryTick}
                <small> {t.ticks}</small>
              </>
            )}
          </dd>
        </div>
      </dl>
      <figure className="delivery-chart">
        <figcaption>{t.delivered}</figcaption>
        <svg
          viewBox="0 0 240 140"
          role="img"
          aria-label={`${t.history}: ${history[0].delivered} → ${m.delivered}, ${first}–${s.tick} ${t.ticks}`}
        >
          <path d="M26 12V114H230" className="chart-axis" fill="none" />
          <path d={path} className="chart-line" fill="none" />
          <text x="20" y="18" textAnchor="end">
            {m.delivered}
          </text>
          <text x="20" y="118" textAnchor="end">
            0
          </text>
          <text x="26" y="135">
            {first}
          </text>
          <text x="230" y="135" textAnchor="end">
            {s.tick}
          </text>
        </svg>
        {!m.delivered && <p className="fine-print">{t.noHistory}</p>}
      </figure>
      <section className="individual rail-section">
        <h3>{t.individual}</h3>
        <label className="visually-hidden" htmlFor="ant-select">
          {t.selectLabel}
        </label>
        <select
          id="ant-select"
          value={selected ?? ''}
          onChange={(e) => {
            onSelect(e.target.value === '' ? null : Number(e.target.value));
          }}
        >
          <option value="">{t.selectLabel}</option>
          {antOptions}
        </select>
        {ant ? (
          <div className="ant-details">
            <dl>
              <div>
                <dt>{t.role}</dt>
                <dd>{t.workerRole}</dd>
              </div>
              <div>
                <dt>{t.carrying}</dt>
                <dd>{ant.carryingFood ? t.yes : t.no}</dd>
              </div>
              <div>
                <dt>{t.dwell}</dt>
                <dd>
                  {ant.dwellTicks} {t.ticks}
                </dd>
              </div>
            </dl>
            <p className="decision">
              <span>{t.decision}</span>
              <strong>{decisionLabels[language][ant.decision]}</strong>
            </p>
            <p className="fine-print">{t.sensor}</p>
            <div className="probe-values">
              {ant.sensors.map((p, i) => (
                <span key={i}>{p.food.toFixed(2)}</span>
              ))}
            </div>
            <button
              className="follow-button"
              aria-pressed={follow}
              onClick={() => setFollow(!follow)}
            >
              <Crosshair />
              {follow ? t.unfollow : t.follow}
            </button>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={sensors}
                onChange={(e) => setSensors(e.target.checked)}
              />
              {t.sensorRadius}
            </label>
          </div>
        ) : (
          <p>{t.selectAnt}</p>
        )}
      </section>
      <details className="metric-details">
        <summary>{t.evidence}</summary>
        <dl>
          <div>
            <dt>{t.searching}</dt>
            <dd>{m.searching}</dd>
          </div>
          <div>
            <dt>{t.throughput}</dt>
            <dd>{m.throughput.toFixed(1)}</dd>
          </div>
          <div>
            <dt>{t.distance}</dt>
            <dd>{m.meanTripDistance?.toFixed(0) ?? '—'} u</dd>
          </div>
          <div>
            <dt>{t.remaining}</dt>
            <dd>{m.remaining}</dd>
          </div>
          <div>
            <dt>{t.actual}</dt>
            <dd>{performance.ticksPerSecond.toFixed(0)}</dd>
          </div>
          <div>
            <dt>{t.worker}</dt>
            <dd>{performance.batchMs.toFixed(1)} ms</dd>
          </div>
        </dl>
        <p className="fine-print">{t.unitsNote}</p>
      </details>
    </aside>
  );
}
import { useMemo } from 'react';
