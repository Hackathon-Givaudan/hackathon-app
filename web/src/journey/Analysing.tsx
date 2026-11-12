/* L'attente après les envies : on montre ce qui se passe, étape par étape,
   au lieu d'un bouton figé. Les étapes avancent seules et s'arrêtent sur la dernière. */
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn, smallLabel } from '../shared/ui';

const STAGES = [
  'Lecture de vos mots',
  'Recherche dans notre référentiel',
  'Choix des notes qui vous ressemblent',
];

export function Analysing() {
  const [reached, setReached] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setReached((stage) => Math.min(stage + 1, STAGES.length - 1)),
      1600,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div role="status" className="mt-6">
      <p className={smallLabel}>Un instant</p>
      <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[56px]">
        Nous écoutons votre projet.
      </h1>
      <ol className="mt-6 border-t border-white/45">
        {STAGES.map((stage, index) => (
          <li
            key={stage}
            className={cn(
              'flex min-h-14 items-center gap-4 border-b border-white/25 px-2 text-[17px] transition-opacity duration-500',
              index > reached && 'opacity-35',
            )}
          >
            <span className="grid size-6 shrink-0 place-items-center border border-white/60">
              {index < reached && <Check className="size-4" />}
              {index === reached && (
                <span className="size-2 animate-pulse bg-[#F2ECF0]" />
              )}
            </span>
            {stage}
          </li>
        ))}
      </ol>
    </div>
  );
}
