/* Geste 2 : le plateau. La marque donne son avis sur chaque fiole, une par une,
   puis relit sa feuille de composition. Les fioles gardées deviennent ses notes validées. */
import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Note } from '../api';
import {
  cn,
  errorText,
  linkButton,
  primaryButton,
  smallLabel,
} from '../shared/ui';
import { MaterialSheet } from './MaterialSheet';

export type Opinion = 'love' | 'some' | 'no';

type Props = {
  notes: Note[];
  opinions: Record<string, Opinion>;
  onOpinion: (noteId: string, opinion: Opinion) => void;
  /* « Une note est une odeur… » : le mot expliqué à la marque */
  noteHelp: string;
  /* Le prénom du guide, qui pose les questions */
  guide: string;
  /* « parfumeur » ou « aromaticien » */
  expert: string;
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
  some: 'Gardée',
  no: 'Écartée',
};

export function TrayStep({
  notes,
  opinions,
  onOpinion,
  noteHelp,
  guide,
  expert,
  busy,
  error,
  onValidate,
  onBack,
}: Props) {
  /* Un double clic ne doit pas noter deux fioles : la suivante prend la place de la première sous le doigt */
  const lastRated = useRef(0);
  const rate = (noteId: string, opinion: Opinion) => {
    if (Date.now() - lastRated.current < 350) return;
    lastRated.current = Date.now();
    onOpinion(noteId, opinion);
  };
  const current = notes.find((note) => !opinions[note.id]);
  const kept = notes.filter(
    (note) => opinions[note.id] && opinions[note.id] !== 'no',
  );
  /* Ce que la marque est en train de préciser sur la fiole en cours : un souvenir, ou un doute */
  const [asking, setAsking] = useState<{
    id: string;
    what: 'memo' | 'unsure';
  }>();
  const [memo, setMemo] = useState('');
  const [rested, setRested] = useState(false);
  const ask = asking?.id === current?.id ? asking?.what : undefined;
  /* À mi-plateau, une pause café pour reposer le nez, comme en atelier */
  const smelled = notes.filter((note) => opinions[note.id]).length;
  const pause =
    !rested && notes.length >= 4 && smelled === Math.ceil(notes.length / 2);

  /* Tant qu'il reste une fiole sans avis, on la présente seule */
  if (current) {
    const position = notes.indexOf(current) + 1;
    return (
      <div className="mt-auto pb-6 pt-10">
        {pause ? (
          <>
            <p className={smallLabel}>On sent ensemble, le plateau en main</p>
            <h1 className="f-display mt-1 text-[48px] leading-[1.05] md:text-[60px]">
              Pause café.
            </h1>
            <p className="mt-3 max-w-[48ch] text-[17px]">
              Respirez votre tasse 30 secondes pour reposer le nez, comme en
              atelier.
            </p>
            <button
              onClick={() => setRested(true)}
              className={cn(primaryButton, 'mt-5')}
            >
              C’est reparti
            </button>
          </>
        ) : (
          <>
            <p className={smallLabel}>
              On sent ensemble · fiole {position} sur {notes.length}
            </p>
            <h1 className="f-display mt-1 text-[48px] leading-[1.05] first-letter:uppercase md:text-[60px]">
              {current.label}
            </h1>
            <p className="mt-3 text-[17px]">{current.reason}.</p>
            <MaterialSheet note={current} />
            <p className="mt-4 text-[15px] opacity-85">
              {noteHelp} Dites-nous ce que vous en pensez.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {CHOICES.map(([opinion, label]) => (
                <button
                  key={opinion}
                  onClick={() => rate(current.id, opinion)}
                  className="min-h-12 border border-line-strong rounded-full px-5 text-[16px] hover:bg-soft"
                >
                  {label}
                </button>
              ))}
              {(['memo', 'unsure'] as const).map((what) => (
                <button
                  key={what}
                  onClick={() => setAsking({ id: current.id, what })}
                  aria-pressed={ask === what}
                  className={cn(
                    'min-h-12 border border-line-strong rounded-full px-5 text-[16px] hover:bg-soft',
                    ask === what && 'bg-selected',
                  )}
                >
                  {what === 'memo' ? 'Ça me rappelle…' : 'Je ne sais pas'}
                </button>
              ))}
            </div>
            {ask === 'memo' && (
              <div className="mt-4 flex max-w-md gap-2">
                <input
                  aria-label="Ce que cette fiole vous rappelle"
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  maxLength={80}
                  placeholder="Le jardin de ma grand-mère, l’été…"
                  className="min-h-12 flex-1 rounded-md border border-line-input bg-card px-3 text-[16px] outline-none placeholder:text-muted focus:border-ink"
                />
                <button
                  onClick={() => {
                    setMemo('');
                    onOpinion(current.id, 'love');
                  }}
                  className={primaryButton}
                >
                  Je la garde
                </button>
              </div>
            )}
            {ask === 'unsure' && (
              <div className="mt-4">
                <p className="max-w-[48ch] text-[17px]">
                  {guide} : « Pas grave. Imaginez-la dans votre création : elle
                  l’éclaire, ou elle l’alourdit ? »
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => onOpinion(current.id, 'some')}
                    className="min-h-12 border border-line-strong rounded-full px-5 text-[16px] hover:bg-soft"
                  >
                    Elle éclaire
                  </button>
                  <button
                    onClick={() => onOpinion(current.id, 'no')}
                    className="min-h-12 border border-line-strong rounded-full px-5 text-[16px] hover:bg-soft"
                  >
                    Elle alourdit
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        <div className="mt-5">
          <button onClick={onBack} className={linkButton}>
            Revenir au profil
          </button>
        </div>

        <section
          aria-label="Votre feuille de composition"
          className="mt-8 border-t border-line pt-4"
        >
          <h2 className={smallLabel}>Votre feuille de composition</h2>
          {kept.length === 0 ? (
            <p className="mt-1 text-[15px] text-secondary">
              Aucune fiole gardée pour l’instant.
            </p>
          ) : (
            <p className="mt-1 text-[16px] first-letter:uppercase">
              {kept.map((note) => note.label).join(' · ')}
            </p>
          )}
          <p className="mt-2 text-sm text-secondary">
            Vous choisissez ce que vous aimez. {guide} équilibre, puis un{' '}
            {expert} vérifie.
          </p>
        </section>
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

      <ul className="mt-5 border-t border-line-strong">
        {notes.map((note) => {
          const left = opinions[note.id] === 'no';
          return (
            <li
              key={note.id}
              className={cn(
                'flex min-h-14 items-center gap-4 border-b border-line px-2',
                left && 'opacity-60',
              )}
            >
              <span className="flex-1">
                <span className="font-semibold block text-[22px] leading-tight first-letter:uppercase">
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
          Revenir au profil
        </button>
      </div>
      {kept.length === 0 && (
        <p className={errorText}>Gardez au moins une fiole.</p>
      )}
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
