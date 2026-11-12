/* Geste 2 : le plateau. La marque donne son avis sur chaque fiole, une par une,
   puis relit sa feuille de composition. Les fioles gardées deviennent ses notes validées. */
import { ArrowRight } from 'lucide-react';
import type { Note } from '../api';
import {
  cn,
  errorText,
  linkButton,
  primaryButton,
  smallLabel,
} from '../shared/ui';

export type Opinion = 'love' | 'some' | 'no';

type Props = {
  notes: Note[];
  opinions: Record<string, Opinion>;
  onOpinion: (noteId: string, opinion: Opinion) => void;
  /* « Une note est une odeur… » : le mot expliqué à la marque */
  noteHelp: string;
  busy: boolean;
  error: string;
  onValidate: () => void;
  onBack: () => void;
};

const CHOICES: [Opinion, string][] = [
  ['love', 'Je l’aime'],
  ['some', 'Un peu'],
  ['no', 'Pas pour moi'],
];
const VERDICT: Record<Opinion, string> = {
  love: 'Gardée',
  some: 'Gardée, en retrait',
  no: 'Écartée',
};

export function TrayStep({
  notes,
  opinions,
  onOpinion,
  noteHelp,
  busy,
  error,
  onValidate,
  onBack,
}: Props) {
  const current = notes.find((note) => !opinions[note.id]);
  const kept = notes.filter(
    (note) => opinions[note.id] && opinions[note.id] !== 'no',
  );

  /* Tant qu'il reste une fiole sans avis, on la présente seule */
  if (current) {
    const position = notes.indexOf(current) + 1;
    return (
      <div className="mt-auto pb-6 pt-10">
        <p className={smallLabel}>
          On sent ensemble · fiole {position} sur {notes.length}
        </p>
        <h1 className="f-display mt-1 text-[48px] leading-[1.05] first-letter:uppercase md:text-[60px]">
          {current.label}
        </h1>
        <p className="mt-3 text-[17px]">{current.reason}.</p>
        <dl className="mt-4 grid max-w-md grid-cols-[110px_1fr] gap-y-1 border-t border-white/45 pt-3 text-[15px]">
          <dt className={smallLabel}>Famille</dt>
          <dd>{current.family}</dd>
        </dl>
        <p className="mt-4 text-[15px] opacity-85">
          {noteHelp} Dites-nous ce que vous en pensez.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {CHOICES.map(([opinion, label]) => (
            <button
              key={opinion}
              onClick={() => onOpinion(current.id, opinion)}
              className="min-h-12 border border-white/45 px-5 text-[16px] hover:bg-white/10"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-5">
          <button onClick={onBack} className={linkButton}>
            Revenir au brief
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>Votre plateau est senti</p>
      <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
        Votre feuille de composition.
      </h1>
      <p className="mt-2 text-[15px]">
        {noteHelp} Vous pouvez encore changer d’avis.
      </p>

      <ul className="mt-5 border-t border-white/45">
        {notes.map((note) => {
          const left = opinions[note.id] === 'no';
          return (
            <li
              key={note.id}
              className={cn(
                'flex min-h-14 items-center gap-4 border-b border-white/25 px-2',
                left && 'opacity-60',
              )}
            >
              <span className="flex-1">
                <span className="f-display block text-[22px] leading-tight first-letter:uppercase">
                  {note.label}
                </span>
                <span className="block text-sm opacity-80">
                  {VERDICT[opinions[note.id]]}
                </span>
              </span>
              <button
                onClick={() => onOpinion(note.id, left ? 'some' : 'no')}
                className={linkButton}
              >
                {left ? `Reprendre ${note.label}` : `Écarter ${note.label}`}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          onClick={onValidate}
          disabled={busy || kept.length === 0}
          className={primaryButton}
        >
          {busy ? 'Recherche de votre formule…' : 'Composer ma formule'}
          <ArrowRight className="size-4" />
        </button>
        <button onClick={onBack} className={linkButton}>
          Revenir au brief
        </button>
      </div>
      {kept.length === 0 && (
        <p className={errorText}>Gardez au moins une fiole.</p>
      )}
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
