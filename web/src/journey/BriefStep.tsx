/* Le brief (écran 05 de la V3) : ce qu'Aurore a entendu, puis onze réponses à compléter d'un geste.
   Rien n'est obligatoire : un ordre de grandeur suffit, et la marque peut passer au profil. */
import { ArrowRight } from 'lucide-react';
import { cn, linkButton, primaryButton, smallLabel } from '../shared/ui';

/* Ce que la marque a complété : un nombre, un choix, ou plusieurs choix */
export type BriefDetails = Record<string, string | string[]>;

type Field = { id: string; label: string; options: string[]; many?: boolean };

/* Les neuf questions à choix de la maquette V3, dans son ordre et avec ses mots */
const FIELDS: Field[] = [
  {
    id: 'projectType',
    label: 'Type de projet',
    options: ['Création', 'Reformulation', 'Extension de gamme'],
  },
  {
    id: 'target',
    label: 'Cible',
    options: ['Clientèle de nos boutiques', 'Grand public', 'Hôtellerie'],
  },
  {
    id: 'salesCountries',
    label: 'Pays de vente',
    options: [
      'France',
      'Union européenne',
      'Royaume-Uni',
      'États-Unis',
      'Asie',
    ],
    many: true,
  },
  {
    id: 'positioning',
    label: 'Positionnement',
    options: ['Accessible', 'Premium', 'Luxe'],
  },
  {
    id: 'objective',
    label: 'Objectif',
    options: ['Se différencier', 'Fidéliser', 'Produit signature'],
  },
  {
    id: 'competition',
    label: 'Mise en concurrence',
    options: [
      'Seulement Givaudan',
      'D’autres fournisseurs aussi',
      'Pas encore décidé',
    ],
  },
  {
    id: 'relation',
    label: 'Relation',
    options: ['En direct', 'Via un distributeur', 'Je ne sais pas'],
  },
  {
    id: 'commitments',
    label: 'Engagements',
    options: ['Naturel', 'Vegan', 'Sans allergènes', 'Matières durables'],
    many: true,
  },
  {
    id: 'constraints',
    label: 'Contraintes',
    options: ['Délai court', 'Réglementation', 'Coût des matières'],
    many: true,
  },
];
const NUMBERS = [
  { id: 'budgetPerKg', label: 'Budget visé au kilo', unit: '€ / kg' },
  { id: 'annualVolumeKg', label: 'Volume annuel', unit: 'kg / an' },
];
const TOTAL = FIELDS.length + NUMBERS.length;

type Props = {
  guide: string;
  /* « Produit : bougie. Ambiance : bord de mer. » */
  wishes: string;
  details: BriefDetails;
  onDetails: (details: BriefDetails) => void;
  onNext: () => void;
  onBack: () => void;
};

export function BriefStep({
  guide,
  wishes,
  details,
  onDetails,
  onNext,
  onBack,
}: Props) {
  /* « Produit : bougie. » redevient une ligne « Produit · bougie » */
  const heard = wishes
    .split('.')
    .map((part) => part.split(':').map((word) => word.trim()))
    .filter(([label, value]) => label && value);
  const done = Object.values(details).filter((value) => value.length).length;

  function choose({ id, many }: Field, option: string) {
    const current = details[id];
    if (!many) {
      return onDetails({ ...details, [id]: current === option ? '' : option });
    }
    const list = Array.isArray(current) ? current : [];
    onDetails({
      ...details,
      [id]: list.includes(option)
        ? list.filter((kept) => kept !== option)
        : [...list, option],
    });
  }

  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>Rédigé par {guide} pendant la séance</p>
      <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
        Voici votre brief.
      </h1>
      <p className="mt-3 text-[17px] leading-snug">
        Il manque quelques réponses : un geste suffit pour chacune.
      </p>

      <h2 className={cn(smallLabel, 'mt-6')}>Ce que {guide} a entendu</h2>
      <dl className="mt-2 grid max-w-md grid-cols-[110px_1fr] gap-y-1 border-t border-line-strong pt-3 text-[16px]">
        {heard.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="first-letter:uppercase">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex items-baseline justify-between gap-4">
        <h2 className="text-[24px] font-semibold">À compléter</h2>
        <p role="status" aria-label="Brief complété" className="text-[15px]">
          <span className="text-muted">Brief complété</span> {done} sur {TOTAL}
        </p>
      </div>
      <div className="mt-2 h-1 rounded-full bg-soft">
        <div
          className="h-1 rounded-full bg-accent transition-[width]"
          style={{ width: `${Math.round((done / TOTAL) * 100)}%` }}
        />
      </div>

      <h3 className="mt-5 text-[17px] font-semibold">Budget et volume</h3>
      <p className="text-[15px] text-secondary">Un ordre de grandeur suffit.</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {NUMBERS.map(({ id, label, unit }) => (
          <label key={id} className="block text-[15px]">
            {label}
            <span className="mt-1 flex items-center gap-2">
              <input
                inputMode="decimal"
                value={(details[id] as string) ?? ''}
                onChange={(event) =>
                  onDetails({
                    ...details,
                    [id]: event.target.value.replace(/[^\d.,]/g, ''),
                  })
                }
                className="min-h-12 w-full rounded-md border border-line-input bg-card px-3 text-[16px] outline-none focus:border-ink"
              />
              <span className="shrink-0 text-muted">{unit}</span>
            </span>
          </label>
        ))}
      </div>

      {FIELDS.map((field) => (
        <fieldset key={field.id} className="mt-5">
          <legend className="text-[17px] font-semibold">
            {field.label}
            {field.many && (
              <span className="ml-2 text-[14px] font-normal text-muted">
                plusieurs réponses possibles
              </span>
            )}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {field.options.map((option) => {
              const current = details[field.id];
              const chosen = Array.isArray(current)
                ? current.includes(option)
                : current === option;
              return (
                <button
                  key={option}
                  onClick={() => choose(field, option)}
                  aria-pressed={chosen}
                  className={cn(
                    'min-h-11 rounded-full border border-line-strong px-4 text-[15px]',
                    chosen ? 'bg-selected ring-2 ring-accent' : 'hover:bg-soft',
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button onClick={onNext} className={primaryButton}>
          Établir mon profil olfactif
          <ArrowRight className="size-4" />
        </button>
        <button onClick={onBack} className={linkButton}>
          Reprendre la séance
        </button>
      </div>
      <p className="mt-3 text-sm text-secondary">
        Prototype : ces réponses restent sur cet écran. Dans le vrai service,
        votre conseiller Givaudan reçoit le brief en même temps que vous.
      </p>
    </div>
  );
}
