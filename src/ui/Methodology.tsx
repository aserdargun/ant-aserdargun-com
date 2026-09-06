import { useEffect, useRef } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import type { Copy } from './i18n';

export function Methodology({
  open,
  onClose,
  copy: t,
}: {
  open: boolean;
  onClose: () => void;
  copy: Copy;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="method-title">
      <div className="dialog-top">
        <h2 id="method-title">{t.model}</h2>
        <button aria-label={t.close} onClick={onClose}>
          <X />
        </button>
      </div>
      <p className="method-intro">{t.biology}</p>
      <p>{t.methodBody}</p>
      <p>{t.fieldBody}</p>
      <h3>{t.evidence}</h3>
      <p>{t.metricBody}</p>
      <p>{t.replayBody}</p>
      <p>{t.caveat}</p>
      <h3>{t.learnMore}</h3>
      <a href="https://doi.org/10.1007/BF01417909" target="_blank" rel="noreferrer">
        Deneubourg et al. (1990) · The self-organizing exploratory pattern of the Argentine ant{' '}
        <ArrowUpRight />
      </a>
      <a href="https://doi.org/10.1007/BF00462870" target="_blank" rel="noreferrer">
        Goss et al. (1989) · Self-organized shortcuts in the Argentine ant <ArrowUpRight />
      </a>
      <p className="fine-print">{t.scope}</p>
    </dialog>
  );
}
