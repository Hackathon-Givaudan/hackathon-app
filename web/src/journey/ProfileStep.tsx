/* Le brief et le profil : la marque relit ce qu'Aurore a entendu, puis répond à cinq questions à deux choix.
   Rien de caché : chaque réponse ajoute un mot du référentiel à son brief, et ce mot s'affiche. */
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Universe } from '../api';
import {
  cn,
  errorText,
  linkButton,
  primaryButton,
  smallLabel,
} from '../shared/ui';
import { VOCABULARY } from '../shared/vocabulary';
import { Analysing } from './Analysing';

type Props = {
  universe: Universe;
  /* Ce qu'Aurore a entendu pendant la séance : « Produit : bougie. Ambiance : bord de mer. » */
  wishes: string;
  busy: boolean;
  error: string;
  onSubmit: (wishes: string) => void;
  onBack: () => void;
};

export function ProfileStep({
  universe,
  wishes,
  busy,
  error,
  onSubmit,
  onBack,
}: Props) {
  /* Une question déjà tranchée pendant la séance n'est pas reposée : « hiver » entendu, pas d'« été ou hiver » */
  const settled = (word: string) =>
    new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, 'iu').test(wishes);
  const duels = VOCABULARY[universe].duels.filter(
    ({ choices }) => !choices.some(({ adds }) => settled(adds)),
  );
  const [answers, setAnswers] = useState<string[]>([]);
  const added = answers.filter(Boolean);

  if (busy) {
    return (
      <div className="mt-auto pb-6 pt-10">
        <Analysing />
      </div>
    );
  }

  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>Rédigé par Aurore pendant la séance</p>
      <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
        Voici votre brief.
      </h1>
      <p className="mt-3 text-[17px] leading-snug">{wishes}</p>

      <h2 className="f-display mt-8 text-[28px] leading-tight">
        Précisez vos goûts, en cinq questions
      </h2>
      <p className="mt-1 text-[15px] opacity-85">
        Chaque réponse ajoute un mot à votre brief. Vous pouvez en laisser.
      </p>
      <ol className="mt-4 border-t border-white/45">
        {duels.map(({ question, choices }, index) => (
          <li
            key={question}
            className="grid items-center gap-2 border-b border-white/25 py-3 sm:grid-cols-[1fr_auto]"
          >
            <span className="text-[16px]">{question}</span>
            <span className="flex gap-2">
              {choices.map(({ label, adds }) => (
                <button
                  key={adds}
                  onClick={() => {
                    const next = [...answers];
                    next[index] = next[index] === adds ? '' : adds;
                    setAnswers(next);
                  }}
                  aria-pressed={answers[index] === adds}
                  className={cn(
                    'min-h-11 border border-white/45 px-3 text-[15px]',
                    answers[index] === adds
                      ? 'bg-[#F2ECF0] text-[#22101F]'
                      : 'hover:bg-white/10',
                  )}
                >
                  {label}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ol>
      {added.length > 0 && (
        <p className="mt-3 text-[15px]">
          <span className={smallLabel}>Ajouté à votre brief</span>{' '}
          {added.join(' · ')}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          onClick={() =>
            onSubmit(
              added.length ? `${wishes} Profil : ${added.join(', ')}.` : wishes,
            )
          }
          disabled={added.length === 0}
          className={primaryButton}
        >
          Voir mon plateau
          <ArrowRight className="size-4" />
        </button>
        <button onClick={() => onSubmit(wishes)} className={linkButton}>
          Passer cette étape
        </button>
        <button onClick={onBack} className={linkButton}>
          Reprendre la séance
        </button>
      </div>
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
