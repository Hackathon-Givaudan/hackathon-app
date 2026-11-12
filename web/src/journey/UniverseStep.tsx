/* Premier écran : la marque comprend ce qu'elle va obtenir, puis dit ce qu'elle crée */
import { ArrowRight } from 'lucide-react';
import type { Universe } from '../api';
import { smallLabel } from '../shared/ui';
import { VOCABULARY } from '../shared/vocabulary';

const PROMISE = [
  ['Vous décrivez', 'Trois questions, et une précision si vous le souhaitez.'],
  ['Nous traduisons', 'Vos mots deviennent des notes, que vous validez.'],
  ['Vous recevez', 'Une première proposition, puis un échantillon à essayer.'],
];

export function UniverseStep({
  onChoose,
}: {
  onChoose: (universe: Universe) => void;
}) {
  return (
    <div className="my-auto py-10">
      <h1 className="f-display text-[52px] leading-[1.02] md:text-[84px]">
        De votre idée à un échantillon.
      </h1>
      <p className="mt-4 max-w-[46ch] text-[18px] leading-snug">
        Décrivez votre projet avec vos mots. Aucun terme technique, environ deux
        minutes.
      </p>

      <ol className="mt-10 grid gap-6 border-t border-white/45 pt-5 sm:grid-cols-3">
        {PROMISE.map(([title, text], index) => (
          <li key={title}>
            <p className={smallLabel}>Étape {index + 1}</p>
            <p className="f-display mt-1 text-[26px] leading-tight">{title}</p>
            <p className="mt-1 text-[15px] opacity-85">{text}</p>
          </li>
        ))}
      </ol>

      <h2 className="f-display mt-12 text-[34px] leading-tight">
        Que créez-vous&nbsp;?
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(Object.keys(VOCABULARY) as Universe[]).map((universe) => (
          <button
            key={universe}
            onClick={() => onChoose(universe)}
            className="group flex min-h-28 items-center justify-between gap-4 border border-white/45 px-5 text-left hover:bg-white/10"
          >
            <span>
              <span className="f-display block text-[32px] leading-tight">
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
