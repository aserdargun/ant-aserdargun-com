import { memo, useState } from 'react';
import { ArrowUpRight, BookOpen, ChevronDown } from 'lucide-react';
import type { Language } from './i18n';
import { learningCopy, termGroups, terms } from './learning';
import { TermHelp } from './TermHelp';

export const LearningGuide = memo(function LearningGuide({ language }: { language: Language }) {
  const [selected, setSelected] = useState(0);
  const t = learningCopy[language];
  const lesson = t.lessons[selected];
  return (
    <section
      className="learning-guide"
      id="learning"
      aria-labelledby="learning-title"
      tabIndex={-1}
    >
      <div className="learning-heading">
        <div>
          <p className="learning-eyebrow">
            <BookOpen aria-hidden="true" />
            {t.eyebrow}
          </p>
          <h2 id="learning-title">{t.title}</h2>
        </div>
        <p>{t.intro}</p>
      </div>
      <div className="lesson-picker" role="group" aria-label={t.lessonLabel}>
        {t.lessons.map((item, index) => (
          <button
            type="button"
            key={index}
            aria-pressed={selected === index}
            aria-controls="active-lesson"
            onClick={() => setSelected(index)}
          >
            <span className="lesson-number" aria-hidden="true">
              0{index + 1}
            </span>
            {item.title}
          </button>
        ))}
      </div>
      <section id="active-lesson" className="active-lesson" aria-labelledby="lesson-title">
        <div className="lesson-heading">
          <div>
            <h3 id="lesson-title">{lesson.title}</h3>
            <p>{lesson.goal}</p>
          </div>
          <a className="lesson-action" href={lesson.target}>
            {lesson.action}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
        <ol className="lesson-steps">
          {lesson.steps.map((step, index) => (
            <li key={index}>
              <span className="step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <h4>{step.title}</h4>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="lesson-terms">
          {lesson.terms.map((term) => (
            <TermHelp key={term} term={term} showLabel />
          ))}
        </div>
        <div className="understanding-check">
          <div>
            <p className="learning-eyebrow">{t.questionLabel}</p>
            <h4>{lesson.question}</h4>
          </div>
          <details key={selected}>
            <summary>
              {t.reveal}
              <ChevronDown aria-hidden="true" />
            </summary>
            <p>{lesson.answer}</p>
          </details>
        </div>
      </section>
      <details className="glossary">
        <summary>
          <span>
            <BookOpen aria-hidden="true" />
            {t.glossary}
          </span>
          <span>
            {Object.keys(terms[language]).length}
            <ChevronDown aria-hidden="true" />
          </span>
        </summary>
        <p>{t.glossaryIntro}</p>
        <div className="glossary-groups">
          {termGroups.map((group, index) => (
            <section key={index} aria-labelledby={`glossary-group-${index}`}>
              <h3 id={`glossary-group-${index}`}>{t.groups[index]}</h3>
              <ul>
                {group.map((term) => (
                  <li key={term}>
                    <TermHelp term={term} showLabel />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </details>
      <div className="learning-source">
        <p>{t.sourceNote}</p>
        <a
          href="https://link.springer.com/article/10.1007/BF01417909"
          target="_blank"
          rel="noreferrer"
        >
          {t.sources} · Deneubourg et al. (1990)
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
});
