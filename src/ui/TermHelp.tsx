import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Info, X } from 'lucide-react';
import type { Language } from './i18n';
import { learningCopy, terms } from './learning';
import type { TermId } from './learning';

const TermContext = createContext<{
  language: Language;
  explain: (term: TermId) => void;
} | null>(null);

export function TermHelpProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  const [activeTerm, setActiveTerm] = useState<TermId | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const context = useMemo(() => ({ language, explain: setActiveTerm }), [language]);
  const t = learningCopy[language];
  const term = activeTerm === null ? null : terms[language][activeTerm];

  useEffect(() => {
    if (activeTerm !== null) dialog.current?.showModal();
    else dialog.current?.close();
  }, [activeTerm]);

  return (
    <TermContext value={context}>
      {children}
      <dialog
        ref={dialog}
        className="term-dialog"
        aria-labelledby={term ? 'term-title' : undefined}
        aria-describedby={term ? 'term-definition' : undefined}
        onClose={() => setActiveTerm(null)}
      >
        {term && (
          <>
            <div className="dialog-top">
              <h2 id="term-title">{term.title}</h2>
              <button type="button" aria-label={t.close} onClick={() => dialog.current?.close()}>
                <X aria-hidden="true" />
              </button>
            </div>
            <p id="term-definition" className="term-definition">
              {term.definition}
            </p>
            <div className="term-model">
              <h3>{t.inModel}</h3>
              <p>{term.model}</p>
            </div>
            <h3>{t.howToRead}</h3>
            <p>{term.observe}</p>
          </>
        )}
      </dialog>
    </TermContext>
  );
}

export function TermHelp({
  term,
  label,
  showLabel = false,
}: {
  term: TermId;
  label?: string;
  showLabel?: boolean;
}) {
  const context = useContext(TermContext);
  if (!context) throw new Error('TermHelp requires TermHelpProvider.');
  const title = label ?? terms[context.language][term].title;
  return (
    <button
      type="button"
      className={showLabel ? 'term-link' : 'term-help'}
      aria-label={`${title}: ${learningCopy[context.language].explain}`}
      aria-haspopup="dialog"
      onClick={() => context.explain(term)}
    >
      {showLabel && <span>{title}</span>}
      <Info aria-hidden="true" />
    </button>
  );
}
