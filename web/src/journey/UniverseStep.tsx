/* Premier écran : la marque comprend ce qu'elle va obtenir, puis dit ce qu'elle crée */
import { ArrowRight } from 'lucide-react';
import type { Universe } from '../api';
import { useState } from 'react';
import { noteColor } from '../bottle/colors';
import { Dialog } from '../shared/Dialog';
import { linkButton, smallLabel } from '../shared/ui';
import { VOCABULARY } from '../shared/vocabulary';

const PROMISE = [
  ['Vous décrivez', 'Un échange écrit avec votre guide, Aurore ou Victor.'],
  [
    'Nous traduisons',
    'Vos mots deviennent des notes, que vous sentez une à une.',
  ],
  ['Vous recevez', 'Une première proposition, puis un échantillon à essayer.'],
];

/* Le parcours en cinq temps, pour qui veut le voir avant d'entrer */
const STAGES = [
  [
    'La séance',
    'Vous racontez votre projet à votre guide, qui note ce qu’il entend.',
  ],
  [
    'Le brief',
    'Vous relisez ce qu’il a compris, et précisez vos goûts en cinq questions.',
  ],
  ['Le plateau', 'Vous donnez votre avis sur chaque fiole proposée.'],
  [
    'La formule',
    'Vous recevez une proposition expliquée, et vous lui donnez un nom.',
  ],
  ['L’échantillon', 'Vous demandez votre échantillon et suivez son avancée.'],
];

/* Quelques matières de l'orgue du parfumeur, pour donner le ton */
const ORGAN = [
  'bergamote',
  'jasmin',
  'sel marin',
  'vanille',
  'cèdre',
  'menthe',
  'rose',
  'ambre',
];

export function UniverseStep({
  onChoose,
}: {
  onChoose: (universe: Universe) => void;
}) {
  const [guide, setGuide] = useState(false);
  return (
    <div className="my-auto py-10">
      <h1 className="f-display text-[52px] leading-[1.02] md:text-[84px]">
        De votre idée à un échantillon.
      </h1>
      <p className="mt-4 max-w-[46ch] text-[18px] leading-snug">
        Décrivez votre projet avec vos mots. Aucun terme technique, environ deux
        minutes.
      </p>

      <button onClick={() => setGuide(true)} className={`${linkButton} mt-3`}>
        Comment ça marche
      </button>
      {guide && (
        <Dialog title="Comment ça marche" onClose={() => setGuide(false)}>
          <ol className="mt-4 border-t border-line-strong">
            {STAGES.map(([stage, text], index) => (
              <li
                key={stage}
                className="grid grid-cols-[28px_1fr] gap-x-3 border-b border-line py-3"
              >
                <span className="text-[13px] font-semibold text-accent-text">
                  {index + 1}
                </span>
                <span>
                  <span className="font-semibold block text-[22px] leading-tight">
                    {stage}
                  </span>
                  <span className="block text-[15px] opacity-85">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </Dialog>
      )}

      {/* L'orgue du parfumeur : des fioles sur deux étagères, leur nom au survol */}
      <div
        role="group"
        aria-label="Quelques matières de l’orgue du parfumeur"
        className="mt-8 max-w-xl rounded-xl border border-line bg-soft px-6 pt-5"
      >
        {[ORGAN.slice(0, 4), ORGAN.slice(4)].map((shelf, row) => (
          <div key={row} className="mb-6">
            <ul className="flex items-end justify-around px-2">
              {shelf.map((matter) => (
                <li key={matter} className="group flex flex-col items-center">
                  <span className="mb-1 text-[12px] text-secondary opacity-0 transition-opacity group-hover:opacity-100">
                    {matter}
                  </span>
                  <span
                    className="block h-16 w-7 rounded-b-md border border-line-strong transition-transform group-hover:-translate-y-1.5"
                    style={{
                      background: `linear-gradient(to top, ${noteColor(matter)} 70%, var(--color-card) 70%)`,
                    }}
                  />
                </li>
              ))}
            </ul>
            <div className="h-2.5 rounded-sm bg-gradient-to-b from-wood to-wood-deep" />
          </div>
        ))}
      </div>

      <ol className="mt-10 grid gap-6 border-t border-line-strong pt-5 sm:grid-cols-3">
        {PROMISE.map(([title, text], index) => (
          <li key={title}>
            <p className={smallLabel}>Étape {index + 1}</p>
            <p className="font-semibold mt-1 text-[26px] leading-tight">
              {title}
            </p>
            <p className="mt-1 text-[15px] opacity-85">{text}</p>
          </li>
        ))}
      </ol>

      <h2 className="font-semibold mt-12 text-[34px] leading-tight">
        Que créez-vous&nbsp;?
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(Object.keys(VOCABULARY) as Universe[]).map((universe) => (
          <button
            key={universe}
            onClick={() => onChoose(universe)}
            className="group flex min-h-28 items-center justify-between gap-4 border border-line-strong rounded-xl px-5 text-left hover:bg-soft"
          >
            <span>
              <span className="font-semibold block text-[32px] leading-tight">
                {VOCABULARY[universe].label}
              </span>
              <span className="block text-sm opacity-80">
                {VOCABULARY[universe].hint}
              </span>
            </span>
            <ArrowRight className="size-6 shrink-0 transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
