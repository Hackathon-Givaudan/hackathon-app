/* Le profil (écran 06 de la V3) : la marque répond à cinq questions à deux choix, sans rien sentir.
   Rien de caché : chaque réponse ajoute un mot du référentiel à son brief, et ce mot s'affiche. */
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
import { ProfileWheel } from './ProfileWheel';

type Props = {
  universe: Universe;
  /* Ce qu'Aurore a entendu pendant la séance : « Produit : bougie. Ambiance : bord de mer. » */
  wishes: string;
  /* Les réponses déjà données : elles restent si la marque revient sur cet écran */
  answers: string[];
  onAnswers: (answers: string[]) => void;
  busy: boolean;
  error: string;
  onSubmit: (wishes: string) => void;
  onBack: () => void;
};

export function ProfileStep({
  universe,
  wishes,
  answers,
  onAnswers,
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
      <p className={smallLabel}>Votre profil {VOCABULARY[universe].profile}</p>
      <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
        On ne sent rien encore. On parle de vous.
      </h1>
      <h2 className="font-semibold mt-6 text-[24px] leading-tight">
        Précisez vos goûts, en {duels.length}{' '}
        {duels.length > 1 ? 'questions' : 'question'}
      </h2>
      <p className="mt-1 text-[15px] opacity-85">
        Chaque réponse ajoute un mot à votre brief. Vous pouvez en laisser.
      </p>
      <ol className="mt-4 border-t border-line-strong">
        {duels.map(({ question, choices }, index) => (
          <li
            key={question}
            className="grid items-center gap-2 border-b border-line py-3 sm:grid-cols-[1fr_auto]"
          >
            <span className="text-[16px]">{question}</span>
            <span className="flex gap-2">
              {choices.map(({ label, adds }) => (
                <button
                  key={adds}
                  onClick={() => {
                    const next = [...answers];
                    next[index] = next[index] === adds ? '' : adds;
                    onAnswers(next);
                  }}
                  aria-pressed={answers[index] === adds}
                  className={cn(
                    'min-h-11 border border-line-strong rounded-full px-3 text-[15px]',
                    answers[index] === adds
                      ? 'bg-selected ring-2 ring-accent'
                      : 'hover:bg-soft',
                  )}
                >
                  {label}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ol>
      <ProfileWheel
        universe={universe}
        words={`${wishes} ${added.join(' ')}`}
      />
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
          Revenir au brief
        </button>
      </div>
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
