import { useEffect, useState } from 'react';
import { Shuffle, ArrowUpRight } from 'lucide-react';
import { useLaboratory } from './useLaboratory';
import { dictionary } from './i18n';
import type { Language } from './i18n';
import { WorldView } from './WorldView';
import { Parameters } from './Parameters';
import { Inspectors } from './Inspectors';
import { Controls } from './Controls';
import { Methodology } from './Methodology';
import type { SimulationConfig } from '../simulation/types';
import type { WorkerCommand } from '../worker/protocol';

export default function App() {
  const { update, send, error, setError, exported } = useLaboratory();
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem('ant-language') === 'tr' ? 'tr' : 'en';
    } catch {
      return 'en';
    }
  });
  const [methodOpen, setMethodOpen] = useState(false);
  const [hypothesis, setHypothesis] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [follow, setFollow] = useState(false),
    [sensors, setSensors] = useState(false);
  const t = dictionary[language];
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem('ant-language', language);
    } catch {
      /* Local preferences are optional. */
    }
  }, [language]);
  const restart = (config: SimulationConfig, play = true) => {
    setSelected(null);
    setFollow(false);
    send({ type: 'reset', config, play });
  };
  const command = (value: WorkerCommand) => {
    if (value.type === 'import') {
      setSelected(null);
      setFollow(false);
    }
    send(value);
  };
  const s = update?.readSnapshot();
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#lab" aria-label="ANT">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>ANT</span>
        </a>
        <span className="brand-subtitle">{t.subtitle}</span>
        <div className="header-actions">
          <button className="text-button" onClick={() => setMethodOpen(true)}>
            {t.methodology}
          </button>
          <div className="languages" role="group" aria-label="Language">
            <button aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>
              EN
            </button>
            <span>/</span>
            <button aria-pressed={language === 'tr'} onClick={() => setLanguage('tr')}>
              TR
            </button>
          </div>
        </div>
      </header>
      <main id="lab">
        <div className="title-band">
          <h1>{t.title}</h1>
          <div className="experiment-meta">
            <span>EXP–001</span>
            {s && (
              <SeedControl
                key={s.config.seed}
                seed={s.config.seed}
                label={t.seed}
                newLabel={t.newSeed}
                onChange={(seed) => restart({ ...s.config, seed }, update?.status.playing)}
                onError={() => setError(t.seedError)}
              />
            )}
          </div>
        </div>
        {error && (
          <div className="error-banner" role="alert">
            <strong>{t.error}.</strong> {error}
            <button onClick={() => setError('')}>{t.close}</button>
          </div>
        )}
        {!s || !update ? (
          <div className="loading" role="status">
            {t.loading}
          </div>
        ) : (
          <div className="laboratory">
            <Parameters
              key={JSON.stringify(s.config)}
              config={s.config}
              copy={t}
              onApply={restart}
              hypothesis={hypothesis}
              setHypothesis={setHypothesis}
            />
            <section className="world-column" aria-label={t.experiment}>
              <WorldView
                readSnapshot={update.readSnapshot}
                copy={t}
                selected={selected}
                onSelect={(id) => {
                  setSelected(id);
                  if (id === null) setFollow(false);
                }}
                follow={follow}
                setFollow={setFollow}
                sensors={sensors}
              />
              <Controls
                status={update.status}
                tick={s.tick}
                copy={t}
                send={command}
                onReset={() => restart(s.config, false)}
                onError={setError}
              />
            </section>
            <Inspectors
              readSnapshot={update.readSnapshot}
              copy={t}
              language={language}
              selected={selected}
              onSelect={(id) => {
                setSelected(id);
                if (id === null) setFollow(false);
              }}
              follow={follow}
              setFollow={setFollow}
              sensors={sensors}
              setSensors={setSensors}
              performance={update.performance}
            />
          </div>
        )}
        <section className="insight">
          <h2>{t.insight}</h2>
          <p>
            {!s || s.metrics.firstDiscoveryTick === null
              ? t.early
              : s.metrics.delivered === 0
                ? t.waitingReturn
                : t.explanation}
          </p>
          <span>
            {t.abstraction} <b>·</b> V0.1
          </span>
        </section>
        <footer>
          <span>{t.scope}</span>
          <a href="https://swi.aserdargun.com" target="_blank" rel="noreferrer">
            SWI · Swarm Intelligence <ArrowUpRight />
          </a>
        </footer>
        <span className="visually-hidden" role="status">
          {exported > 0 ? t.exported : ''}
        </span>
      </main>
      <Methodology open={methodOpen} onClose={() => setMethodOpen(false)} copy={t} />
    </>
  );
}

function SeedControl({
  seed,
  label,
  newLabel,
  onChange,
  onError,
}: {
  seed: number;
  label: string;
  newLabel: string;
  onChange: (seed: number) => void;
  onError: () => void;
}) {
  const [draft, setDraft] = useState(String(seed));
  const submit = () => {
    const value = Number(draft);
    if (!/^\d+$/.test(draft) || !Number.isInteger(value) || value > 0xffffffff) {
      onError();
      return;
    }
    if (value !== seed) onChange(value);
  };
  return (
    <form
      className="seed-control"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="seed-input">{label}</label>
      <input
        id="seed-input"
        aria-label={label}
        value={draft}
        inputMode="numeric"
        maxLength={10}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={submit}
      />
      <button
        type="button"
        title={newLabel}
        aria-label={newLabel}
        onClick={() => {
          const value = crypto.getRandomValues(new Uint32Array(1))[0];
          onChange(value);
        }}
      >
        <Shuffle />
      </button>
    </form>
  );
}
