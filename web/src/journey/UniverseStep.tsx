/* Premier écran : la marque dit ce qu'elle crée, un parfum ou un arôme */
import { ArrowRight } from 'lucide-react';
import type { Universe } from '../api';
import { VOCABULARY } from '../shared/vocabulary';

export function UniverseStep({
  onChoose,
}: {
  onChoose: (universe: Universe) => void;
}) {
  return (
    <div className="mt-auto pb-6 pt-10">
      <h1 className="f-display text-[52px] leading-[1.05] md:text-[68px]">
        Que créez-vous&nbsp;?
      </h1>
      <p className="mt-3 text-[16px]">
        Trois questions, puis une première proposition. Aucun terme technique.
      </p>

      <div className="mt-8 border-t border-white/45">
        {(Object.keys(VOCABULARY) as Universe[]).map((universe) => (
          <button
            key={universe}
            onClick={() => onChoose(universe)}
            className="group flex min-h-24 w-full items-center justify-between gap-4 border-b border-white/25 px-2 text-left hover:bg-white/10"
          >
            <span>
              <span className="f-display block text-[34px] leading-tight">
                {VOCABULARY[universe].label}
              </span>
              <span className="block text-sm opacity-80">
                {VOCABULARY[universe].hint}
              </span>
            </span>
            <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
