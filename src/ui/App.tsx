import { LabShell } from '@aserdargun/lab-ui';
import '@aserdargun/lab-ui/styles.css';
import { manifest, experiments, initialRoute } from '../ils/catalog';
import { useEffect, useState } from 'react';
import { Shuffle, ArrowUpRight, BookOpen, ArrowDown } from 'lucide-react';
import { useLaboratory } from './useLaboratory';
import { dictionary } from './i18n';
import type { Language } from './i18n';
import { WorldView } from './WorldView';
import { Parameters } from './Parameters';
import { Inspectors } from './Inspectors';
import { Controls } from './Controls';
import { Methodology } from './Methodology';
import { TermHelp, TermHelpProvider } from './TermHelp';
import { LearningGuide } from './LearningGuide';
import { learningCopy } from './learning';
import type { SimulationConfig } from '../simulation/types';
import type { WorkerCommand } from '../worker/protocol';
import { parseRun, VersionMismatchError } from '../experiments/run';
import { defaultConfig, parseConfig } from '../experiments/config';

const defaultWorld = JSON.stringify(parseConfig(defaultConfig()).world);

export default function App() {
  const [route] = useState(() => initialRoute(location.search));
  const [language, setLanguage] = useState<Language>(() => {
    if (route.locale) return route.locale;
    try {
      return localStorage.getItem('ant-language') === 'tr' ? 'tr' : 'en';
    } catch {
      return 'en';
    }
  });
  const [methodOpen, setMethodOpen] = useState(false);
  const { update, send, error, setError, exported, failed, retry } = useLaboratory(language);
  const [hypothesis, setHypothesis] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [viewRevision, setViewRevision] = useState(0);
  const [follow, setFollow] = useState(false),
    [sensors, setSensors] = useState(false);
  const t = dictionary[language];
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `ANT - ${dictionary[language].subtitle}`;
    try {
      localStorage.setItem('ant-language', language);
    } catch {
      /* Local preferences are optional. */
    }
  }, [language]);
  const restart = (config: SimulationConfig, play = true) => {
    setViewRevision((value) => value + 1);
    setSelected(null);
    setFollow(false);
    send({ type: 'reset', config, play });
  };
  const command = (value: WorkerCommand) => {
    if (value.type === 'import') {
      try {
        parseRun(value.data);
      } catch (error) {
        setError(error instanceof VersionMismatchError ? t.versionError : t.importError);
        return;
      }
      setSelected(null);
      setFollow(false);
      setViewRevision((value) => value + 1);
    }
    send(value);
  };
  const s = update?.readSnapshot();
  const customWorld = s && JSON.stringify(s.config.world) !== defaultWorld;
  return (
    <TermHelpProvider language={language}>
      <a className="skip-link" href="#world">
        {t.skipToWorld}
      </a>
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
          <div className="languages" role="group" aria-label={t.language}>
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
            <span>{customWorld ? t.customWorld : 'EXP–001'}</span>
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
        <div className="learning-entry">
          <a href="#learning">
            <BookOpen aria-hidden="true" />
            {learningCopy[language].nav}
            <ArrowDown aria-hidden="true" />
          </a>
          <p>{learningCopy[language].hint}</p>
        </div>
        {error && (
          <div className="error-banner" role="alert">
            <strong>{t.error}.</strong> {error}
            <button onClick={() => setError('')}>{t.close}</button>
          </div>
        )}
        {failed ? (
          <div className="loading" role="alert">
            <p>{t.workerError}</p>
            <button
              onClick={() => {
                setSelected(null);
                setFollow(false);
                retry();
              }}
            >
              {t.retry}
            </button>
          </div>
        ) : !s || !update ? (
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
              customWorld={Boolean(customWorld)}
            />
            <section className="world-column" id="world" tabIndex={-1} aria-label={t.experiment}>
              <WorldView
                resetRevision={viewRevision}
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
                language={language}
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
            {s?.config.fields.food.deposit === 0
              ? t.noDeposition
              : s?.config.brain.signalGain === 0
                ? t.noSensing
                : !s || s.metrics.firstDiscoveryTick === null
                  ? t.early
                  : s.metrics.delivered === 0
                    ? t.waitingReturn
                    : t.explanation}
          </p>
          <span>
            {t.abstraction} <b>·</b> V0.1
            <TermHelp term="abstraction" label={t.abstraction} />
          </span>
        </section>
        <LearningGuide language={language} initialLesson={route.lesson} />
        <LabShell manifest={manifest} experiment={experiments[0]} locale={language}>
          <p>
            {language === 'en'
              ? 'Current applied configuration; imported custom worlds remain part of the experiment.'
              : 'Mevcut uygulanmış yapılandırma; içe aktarılan özel dünyalar deneyin parçası olarak kalır.'}
          </p>
        </LabShell>
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
    </TermHelpProvider>
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
      <TermHelp term="seed" label={label} />
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
