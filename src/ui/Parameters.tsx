import { useState } from 'react';
import { FlaskConical, RotateCw } from 'lucide-react';
import type { SimulationConfig } from '../simulation/types';
import type { Copy } from './i18n';
import { TermHelp } from './TermHelp';

export function Parameters({
  config,
  copy: t,
  onApply,
  hypothesis,
  setHypothesis,
  customWorld,
}: {
  config: SimulationConfig;
  copy: Copy;
  onApply: (config: SimulationConfig) => void;
  hypothesis: string;
  setHypothesis: (value: string) => void;
  customWorld: boolean;
}) {
  const [population, setPopulation] = useState(config.population);
  const [evaporation, setEvaporation] = useState(config.fields.food.evaporation);
  const [exploration, setExploration] = useState(config.brain.exploration);
  const numericPopulation =
    config.population < 10 || config.population > 1000 || config.population % 10 !== 0;
  const numericEvaporation =
    config.fields.food.evaporation < 0.001 ||
    config.fields.food.evaporation > 0.02 ||
    Math.abs(
      config.fields.food.evaporation * 1000 - Math.round(config.fields.food.evaporation * 1000),
    ) > 1e-9;
  const numericExploration =
    Math.abs(config.brain.exploration * 100 - Math.round(config.brain.exploration * 100)) > 1e-9;
  return (
    <aside className="experiment-rail">
      <h2>{t.experiment}</h2>
      <p>{customWorld ? t.customWorldNote : t.intro}</p>
      <p>{t.intro2}</p>
      <section className="rail-section">
        <h3>{t.rules}</h3>
        <ol className="rules">
          {[t.rule1, t.rule2, t.rule3].map((rule, i) => (
            <li key={rule}>
              <span>{i + 1}</span>
              {rule}
            </li>
          ))}
        </ol>
      </section>
      <form
        className="rail-section parameters"
        id="parameters"
        tabIndex={-1}
        onSubmit={(e) => {
          e.preventDefault();
          onApply({
            ...config,
            population,
            brain: { ...config.brain, exploration },
            fields: { ...config.fields, food: { ...config.fields.food, evaporation } },
          });
        }}
      >
        <h3>{t.parameters}</h3>
        <div className="parameter-label">
          <label htmlFor="population">{t.population}</label>
          <TermHelp term="population" label={t.population} />
          <output aria-hidden="true">{population}</output>
        </div>
        <input
          id="population"
          type={numericPopulation ? 'number' : 'range'}
          required
          min={numericPopulation ? 1 : 10}
          max={numericPopulation ? 5000 : 1000}
          step={numericPopulation ? 1 : 10}
          value={population}
          onChange={(e) => setPopulation(+e.target.value)}
        />
        <div className="range-limits">
          <span>{numericPopulation ? '1' : '10'}</span>
          <span>{numericPopulation ? '5,000' : '1,000'}</span>
        </div>
        <div className="parameter-label">
          <label htmlFor="evaporation">{t.evaporation}</label>
          <TermHelp term="evaporation" label={t.evaporation} />
          <output aria-hidden="true">
            {numericEvaporation ? evaporation : evaporation.toFixed(3)}
          </output>
        </div>
        <input
          id="evaporation"
          type={numericEvaporation ? 'number' : 'range'}
          required
          min={numericEvaporation ? 0 : 0.001}
          max={numericEvaporation ? 0.1 : 0.02}
          step={numericEvaporation ? 'any' : 0.001}
          value={evaporation}
          onChange={(e) => setEvaporation(+e.target.value)}
        />
        <div className="range-limits">
          <span>{numericEvaporation ? '0' : '0.001'}</span>
          <span>{numericEvaporation ? '0.100' : '0.020'}</span>
        </div>
        <div className="parameter-label">
          <label htmlFor="exploration">{t.exploration}</label>
          <TermHelp term="exploration" label={t.exploration} />
          <output aria-hidden="true">
            {numericExploration ? exploration : exploration.toFixed(2)}
          </output>
        </div>
        <input
          id="exploration"
          type={numericExploration ? 'number' : 'range'}
          required
          min="0"
          max="1"
          step={numericExploration ? 'any' : 0.01}
          value={exploration}
          onChange={(e) => setExploration(+e.target.value)}
        />
        <div className="range-limits">
          <span>0.00</span>
          <span>1.00</span>
        </div>
        <button className="primary apply" type="submit">
          <RotateCw />
          {t.apply}
        </button>
        <p className="fine-print">{t.restartNote}</p>
      </form>
      <details className="hypothesis">
        <summary>
          <FlaskConical />
          <span>{t.hypothesis}</span>
        </summary>
        <textarea
          aria-label={t.hypothesis}
          placeholder={t.prediction}
          value={hypothesis}
          onChange={(e) => setHypothesis(e.target.value)}
          maxLength={600}
        />
        <TermHelp term="hypothesis" showLabel />
      </details>
    </aside>
  );
}
