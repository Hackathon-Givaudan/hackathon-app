/* Bienvenue : le compte de la marque est prêt (un faux compte pour le prototype),
   elle choisit son guide, puis la séance commence. Écrans 02 et 03 du prototype du Product. */
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn, linkButton, primaryButton, smallLabel } from '../shared/ui';

export type Guide = 'Aurore' | 'Victor';

/* Le faux compte du prototype : Léa, fondatrice de Maison Lumen */
export const ACCOUNT = {
  name: 'Léa Martin',
  brand: 'Maison Lumen',
  role: 'Fondatrice',
  email: 'lea@maison-lumen.fr',
};

const GUIDES: [Guide, string][] = [
  ['Aurore', 'Parfumeuse IA, formée au savoir-faire Givaudan.'],
  ['Victor', 'Parfumeur IA, même savoir-faire, une autre voix.'],
];

type Props = {
  guide: Guide;
  onGuide: (guide: Guide) => void;
  onStart: () => void;
  onBack: () => void;
};

export function WelcomeStep({ guide, onGuide, onStart, onBack }: Props) {
  const [details, setDetails] = useState(false);
  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>Votre atelier est prêt</p>
      <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
        Bienvenue, Léa.
      </h1>
      <p className="mt-3 text-[17px] leading-snug">
        « Léa, votre atelier est prêt. Partez à la découverte, je vous retrouve
        à l’arrivée. » Karim B., votre conseiller Givaudan.
      </p>

      <dl className="mt-6 grid max-w-md grid-cols-[130px_1fr] gap-y-2 border-t border-line pt-4 text-[16px]">
        <dt className="text-muted">Nom</dt>
        <dd>{ACCOUNT.name}</dd>
        <dt className="text-muted">Marque</dt>
        <dd>{ACCOUNT.brand}</dd>
        <dt className="text-muted">Rôle</dt>
        <dd>{ACCOUNT.role}</dd>
      </dl>
      <button
        onClick={() => setDetails(!details)}
        className={`${linkButton} mt-2`}
      >
        {details ? 'Masquer' : 'Pourquoi pas de mot de passe ?'}
      </button>
      {details && (
        <p className="mt-1 max-w-[52ch] text-[15px] text-secondary">
          Prototype : le compte de Léa est préparé à l’avance. Le vrai service
          enverrait un lien de connexion à {ACCOUNT.email}.
        </p>
      )}

      <h2 className="mt-8 text-[22px] font-semibold">Votre guide</h2>
      <p className="mt-1 text-[15px] text-secondary">
        Deux parfumeurs, un même savoir-faire. L’échange se fait par écrit.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {GUIDES.map(([name, text]) => (
          <button
            key={name}
            onClick={() => onGuide(name)}
            aria-label={name}
            aria-pressed={guide === name}
            className={cn(
              'min-h-24 border border-line-input bg-card px-4 py-3 text-left hover:bg-soft',
              guide === name && 'bg-selected ring-2 ring-accent',
            )}
          >
            <span className="block text-[20px] font-semibold">{name}</span>
            <span className="block text-[15px] text-secondary">{text}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button onClick={onStart} className={primaryButton}>
          Commencer la séance
          <ArrowRight className="size-4" />
        </button>
        <button onClick={onBack} className={linkButton}>
          Changer d’univers
        </button>
      </div>
    </div>
  );
}
