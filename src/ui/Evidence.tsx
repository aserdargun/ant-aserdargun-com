import { memo } from 'react';
import { ArrowUpRight, FlaskConical } from 'lucide-react';
import type { Copy, Language } from './i18n';
import { evidence, researchReviewDate } from './validatedRuns';
import { experiments } from '../ils/catalog';
import { learningCopy } from './learning';

const deneubourg = {
  title: 'Deneubourg et al. (1990) · The self-organizing exploratory pattern of the Argentine ant',
  href: 'https://link.springer.com/article/10.1007/BF01417909',
};
const goss = {
  title: 'Goss et al. (1989) · Self-organized shortcuts in the Argentine ant',
  href: 'https://link.springer.com/article/10.1007/BF00462870',
};

export const Evidence = memo(function Evidence({
  language,
  copy: t,
}: {
  language: Language;
  copy: Copy;
}) {
  const studies = learningCopy[language].lessons.length;
  return (
    <section className="evidence" id="evidence" aria-labelledby="evidence-title">
      <div className="evidence-heading">
        <div>
          <p className="learning-eyebrow">
            <FlaskConical aria-hidden="true" />
            {t.evidenceEyebrow}
          </p>
          <h2 id="evidence-title">{t.evidenceTitle}</h2>
        </div>
        <p>{t.evidenceIntro}</p>
      </div>
      <p className="evidence-label">
        <b>{t.evidenceLabel}</b> {t.evidenceMachine}
      </p>
      <div className="evidence-table-wrap" tabIndex={0} role="group" aria-label={t.evidenceTitle}>
        <table className="evidence-table">
          <caption className="visually-hidden">{t.evidenceTitle}</caption>
          <thead>
            <tr>
              <th scope="col">{t.seed}</th>
              <th scope="col">{t.evidenceGain}</th>
              <th scope="col">{t.delivered}</th>
              <th scope="col">{t.throughput}</th>
              <th scope="col">{t.coverage}</th>
              <th scope="col">{t.discovery}</th>
              <th scope="col">{t.evidenceTrail}</th>
              <th scope="col">{t.evidenceSpeed}</th>
            </tr>
          </thead>
          <tbody>
            {evidence.runs.map((run) => (
              <tr key={`${run.seed}-${run.signalGain}`}>
                <th scope="row">{run.seed}</th>
                <td>{run.signalGain === 1 ? t.evidenceGainOn : t.evidenceGainOff}</td>
                <td>{run.metrics.delivered}</td>
                <td>{run.metrics.throughput}</td>
                <td>{run.metrics.coverage.toFixed(1)}%</td>
                <td>{run.metrics.firstDiscoveryTick}</td>
                <td>{run.trail.connectedToFood ? t.yes : t.no}</td>
                <td>{Math.round(run.ticksPerSecond).toLocaleString(t.locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="evidence-fine">
        {t.tick} {evidence.tickBudget.toLocaleString(t.locale)} {t.ticks} · {t.evidenceVersions}{' '}
        <b>
          {evidence.versions.simulation} · {evidence.versions.experiment} · {evidence.versions.prng}
        </b>{' '}
        · {t.evidenceRuntime} <b>{evidence.runtime}</b>
      </p>
      <div className="evidence-review">
        <p>
          <b>{t.evidenceSourcesChecked}</b> <b>{researchReviewDate}</b> — {t.evidenceFullText}
        </p>
        <ul>
          {[deneubourg, goss].map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer">
                {source.title}
                <ArrowUpRight aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="evidence-notes">
        <section aria-labelledby="scope-title">
          <h3 id="scope-title">{t.scopeTitle}</h3>
          <p>
            <b>
              {experiments.length} {t.scopeExperiments}
            </b>{' '}
            · <b>{studies}</b> {t.scopeStudies}
          </p>
          <p>{t.scopeBody}</p>
          <p>{t.scopeNext}</p>
          <ol>
            <li>{t.scopeNextAblation}</li>
            <li>{t.scopeNextCompare}</li>
            <li>{t.scopeNextSandbox}</li>
          </ol>
        </section>
        <section aria-labelledby="sibling-title">
          <h3 id="sibling-title">{t.siblingTitle}</h3>
          <p>{t.siblingBody}</p>
          <a href="https://bee.aserdargun.com/" target="_blank" rel="noreferrer">
            BEE · Arı Kolonisi Zekâ Laboratuvarı
            <ArrowUpRight aria-hidden="true" />
          </a>
        </section>
      </div>
    </section>
  );
});
