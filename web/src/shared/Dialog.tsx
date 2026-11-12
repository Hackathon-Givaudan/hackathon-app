/* Une fenêtre par-dessus la page, avec son titre et son bouton Fermer */
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = { title: string; onClose: () => void; children: ReactNode };

export function Dialog({ title, onClose, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90svh] w-full max-w-xl overflow-auto border border-line-strong bg-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-semibold text-[30px] leading-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-10 shrink-0 place-items-center hover:bg-soft"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
