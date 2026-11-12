/* L'attente du plateau : en vrai, Givaudan l'envoie par la poste. Ici, la marque suit son envoi
   puis annonce qu'il est arrivé. Écran 08 du prototype du Product. */
import { ArrowRight } from 'lucide-react';
import { cn, linkButton, primaryButton, smallLabel } from '../shared/ui';

const STAGES = [
  ['Validé', 'Par Karim, votre conseiller'],
  ['Préparé', 'Par nos équipes'],
  ['En route', 'Expédié ce matin'],
  ['Livraison', 'Délai : [X]'],
];

type Props = { vials: number; onArrived: () => void; onBack: () => void };

export function DeliveryStep({ vials, onArrived, onBack }: Props) {
  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>{vials} fioles, choisies d’après votre brief</p>
      <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
        Votre plateau arrive.
      </h1>
      <ol
        aria-label="Suivi de l’envoi"
        className="mt-6 grid gap-2 sm:grid-cols-4"
      >
        {STAGES.map(([stage, text], index) => (
          <li
            key={stage}
            className={cn(
              'border-t-2 pt-2',
              index <= 2 ? 'border-accent' : 'border-line opacity-60',
            )}
          >
            <span className="block text-[16px] font-semibold">{stage}</span>
            <span className="block text-sm text-secondary">{text}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 max-w-[52ch] text-[16px]">
        Quand il arrive, vous sentez chaque fiole avec votre guide. Prévoyez un
        café : il sert à reposer le nez entre deux fioles.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button onClick={onArrived} className={primaryButton}>
          Le plateau est arrivé, on commence
          <ArrowRight className="size-4" />
        </button>
        <button onClick={onBack} className={linkButton}>
          Revenir au brief
        </button>
      </div>
      <p className="mt-4 text-[13px] text-muted">
        Prototype : aucun plateau n’est réellement envoyé.
      </p>
    </div>
  );
}
