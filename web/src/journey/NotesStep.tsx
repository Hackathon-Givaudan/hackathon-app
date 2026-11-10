/* Geste 2 : le récapitulatif. La marque vérifie ce que nous avons compris
   et garde les notes qui traduisent ses envies */
import { ArrowRight, Check } from 'lucide-react';
import type { Note } from '../api';
import {
  cn,
  errorText,
  linkButton,
  primaryButton,
  smallLabel,
} from '../shared/ui';

type Props = {
  wishes: string;
  /* « Une note est une odeur… » : le mot expliqué à la marque */
  noteHelp: string;
  notes: Note[];
  keptIds: string[];
  onToggle: (noteId: string) => void;
  busy: boolean;
  error: string;
  onValidate: () => void;
  onBack: () => void;
};

export function NotesStep({
  wishes,
  noteHelp,
  notes,
  keptIds,
  onToggle,
  busy,
  error,
  onValidate,
  onBack,
}: Props) {
  /* Les idées retenues, tirées des raisons : « Évoque « bord de mer » » donne « bord de mer » */
  const heard = [
    ...new Set(
      notes
        .map(
          ({ reason }) =>
            reason?.match(/« (.+) »/)?.[1] ?? reason?.split(' : ')[1],
        )
        .filter((idea) => idea !== undefined),
    ),
  ];

  return (
    <div className="mt-auto pb-6 pt-10">
      <h1 className="f-display text-[44px] leading-[1.08] md:text-[52px]">
        Voici ce que nous avons compris.
      </h1>
      <p className="mt-2 text-[15px]">
        Vérifiez avant de voir notre proposition. Vous pouvez tout modifier.
      </p>

      <p className={cn(smallLabel, 'mt-6')}>Votre projet</p>
      <p className="mt-1 text-[15px] opacity-85">« {wishes} »</p>
      {heard.length > 0 && (
        <p className="mt-3 text-[15px]">
          <span className={smallLabel}>Nous avons entendu</span>{' '}
          {heard.join(' · ')}
        </p>
      )}

      <h2 className="f-display mt-6 text-[28px] leading-tight">
        Vos envies, traduites en notes
      </h2>
      <p className="mt-1 text-[15px]">
        {noteHelp} Retirez celles qui ne vous ressemblent pas.
      </p>

      <ul className="mt-5 border-t border-white/45">
        {notes.map((note) => {
          const kept = keptIds.includes(note.id);
          return (
            <li key={note.id} className="border-b border-white/25">
              <button
                onClick={() => onToggle(note.id)}
                aria-pressed={kept}
                className={cn(
                  'flex min-h-16 w-full items-center gap-4 px-2 text-left hover:bg-white/10',
                  !kept && 'opacity-50',
                )}
              >
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center border border-white/60',
                    kept && 'bg-[#F2ECF0] text-[#22101F]',
                  )}
                >
                  {kept && <Check className="size-4" />}
                </span>
                <span className="flex-1">
                  <span
                    className={cn(
                      'f-display block text-[24px] leading-tight first-letter:uppercase',
                      !kept && 'line-through',
                    )}
                  >
                    {note.label}
                  </span>
                  <span className="block text-sm opacity-80">
                    {note.reason}
                  </span>
                </span>
                <span className={smallLabel}>{note.family}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          onClick={onValidate}
          disabled={busy || keptIds.length === 0}
          className={primaryButton}
        >
          {busy
            ? 'Recherche de votre proposition…'
            : 'C’est bien ça, voir la proposition'}
          <ArrowRight className="size-4" />
        </button>
        <button onClick={onBack} className={linkButton}>
          Modifier mon projet
        </button>
      </div>
      {keptIds.length === 0 && (
        <p className={errorText}>Gardez au moins une note.</p>
      )}
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
