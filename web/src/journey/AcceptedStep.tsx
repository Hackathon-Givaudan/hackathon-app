/* Le suivi : la demande est envoyée, la marque voit où en est son échantillon,
   puis dit ce qu'elle en a pensé. Aucun échantillon ne part vraiment : la réception est simulée. */
import { useState } from 'react';
import type { Formula } from '../api';
import { cn, linkButton, primaryButton, smallLabel } from '../shared/ui';

type Props = {
  formula: Formula;
  /* Le nom donné par la marque, sinon celui de la référence */
  name: string;
  expert: string;
  onRestart: () => void;
};

const STAGES = [
  'Composée',
  'Demande envoyée',
  'Échantillon reçu',
  'Retour donné',
];
const ADJUSTMENTS = [
  'Plus de fraîcheur',
  'Plus de tenue',
  'Plus de douceur',
  'Elle me convient',
];

export function AcceptedStep({ formula, name, expert, onRestart }: Props) {
  const [received, setReceived] = useState(false);
  const [feedback, setFeedback] = useState('');
  const reached = feedback ? 3 : received ? 2 : 1;

  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>{name}</p>
      <h1 className="f-display mt-1 text-[48px] leading-[1.05] md:text-[60px]">
        {received
          ? 'Comment vit-elle chez vous ?'
          : 'Votre demande est envoyée.'}
      </h1>

      <ol
        aria-label="Suivi"
        className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {STAGES.map((stage, index) => (
          <li
            key={stage}
            aria-current={index === reached ? 'step' : undefined}
            className={cn(
              'border-t-2 pt-2 text-sm',
              index <= reached ? 'border-ink' : 'border-line opacity-55',
            )}
          >
            <span className="mr-2 text-[12px] text-muted">{index + 1}</span>
            {stage}
          </li>
        ))}
      </ol>

      {!received ? (
        <>
          <ul className="mt-6 border-t border-line-strong text-[16px]">
            <li className="border-b border-line py-3">
              Votre projet et vos notes sont transmis : vous n’aurez rien à
              répéter.
            </li>
            <li className="border-b border-line py-3">
              Un échantillon de {name} vous est préparé. Délai : [X].
            </li>
            <li className="border-b border-line py-3">
              Votre {expert} ajuste la formule avec vous après l’essai.
            </li>
          </ul>
          <p className={`${smallLabel} mt-5`}>Vos matières</p>
          <p className="mt-1 text-[15px] first-letter:uppercase">
            {formula.notes.map(({ note }) => note.label).join(', ')}
          </p>
          <button
            onClick={() => setReceived(true)}
            className={`${primaryButton} mt-6`}
          >
            Simuler la réception de l’échantillon
          </button>
        </>
      ) : feedback ? (
        <p className="mt-6 text-[17px]">
          Votre retour est noté. « {feedback} »
        </p>
      ) : (
        <>
          <p className="mt-5 text-[16px]">
            Vous avez essayé votre échantillon. Que faut-il ajuster ?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ADJUSTMENTS.map((adjustment) => (
              <button
                key={adjustment}
                onClick={() => setFeedback(adjustment)}
                className="min-h-12 border border-line-strong rounded-full px-4 text-[16px] hover:bg-soft"
              >
                {adjustment}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="mt-5 text-[13px] text-muted">
        Prototype : aucun échantillon n’est réellement envoyé, et le retour
        n’est pas encore transmis au conseiller.
      </p>
      <button onClick={onRestart} className={`${linkButton} mt-3`}>
        Démarrer un autre projet
      </button>
    </div>
  );
}
