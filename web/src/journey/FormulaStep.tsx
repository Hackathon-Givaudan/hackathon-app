/* Geste 3 : la marque reçoit une formule, puis l'accepte (geste 4) */
import { Check } from 'lucide-react';
import { isDemo } from '../api';
import type { Formula } from '../api';
import { errorText, linkButton, primaryButton, smallLabel } from '../shared/ui';

type Props = {
  formula: Formula;
  expert: string;
  busy: boolean;
  error: string;
  onAccept: () => void;
  onBack: () => void;
};

export function FormulaStep({
  formula,
  expert,
  busy,
  error,
  onAccept,
  onBack,
}: Props) {
  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>Notre proposition</p>
      <h1 className="f-display mt-1 text-[56px] leading-none md:text-[72px]">
        {formula.name}
      </h1>
      <p className="mt-4 max-w-[52ch] text-[17px] leading-snug">
        {formula.explanation}
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-x-8 border-t border-white/45 sm:grid-cols-3">
        {formula.notes.map(({ note, share }) => (
          <li key={note.id} className="border-b border-white/25 py-2.5">
            <p className={smallLabel}>{note.family}</p>
            <p className="f-display text-[21px] leading-tight first-letter:uppercase">
              {note.label}
            </p>
            <p className="mono text-sm">{share}%</p>
          </li>
        ))}
      </ul>
      <p className="mono mt-3 text-[11px] opacity-80">
        {isDemo ? 'Référence de démonstration' : 'Référence de notre banque'} (
        {formula.source}). Parts illustratives.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button onClick={onAccept} disabled={busy} className={primaryButton}>
          <Check className="size-4" />
          {busy ? 'Enregistrement…' : 'Accepter cette formule'}
        </button>
        <button onClick={onBack} className={linkButton}>
          Revoir les notes
        </button>
      </div>
      <p className="mt-4 text-sm opacity-85">
        Un doute ? Votre {expert} peut l’ajuster avec vous après l’échantillon.
      </p>
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
