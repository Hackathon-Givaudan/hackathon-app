/* Le brief (écran 05 de la V3) : ce qu'Aurore a entendu, puis onze réponses à compléter d'un geste.
   Rien n'est obligatoire : un ordre de grandeur suffit, et la marque peut passer au profil. */
import { ArrowRight } from 'lucide-react';
import { cn, linkButton, primaryButton, smallLabel } from '../shared/ui';

/* Ce que la marque a complété : un nombre, un choix, ou plusieurs choix */
export type BriefDetails = Record<string, string | string[]>;

/* Chaque choix : l'identifiant du contrat (openapi.yaml), puis le mot affiché */
type Field = {
  id: string;
  label: string;
  options: [string, string][];
  many?: boolean;
};

/* Les neuf questions à choix de la maquette V3, dans son ordre et avec ses mots */
export const FIELDS: Field[] = [
  {
    id: 'projectType',
    label: 'Type de projet',
    options: [
      ['creation', 'Création'],
      ['reformulation', 'Reformulation'],
      ['extension_gamme', 'Extension de gamme'],
    ],
  },
  {
    id: 'target',
    label: 'Cible',
    options: [
      ['clientele_boutiques', 'Clientèle de nos boutiques'],
      ['grand_public', 'Grand public'],
      ['hotellerie', 'Hôtellerie'],
    ],
  },
  {
    id: 'salesCountries',
    label: 'Pays de vente',
    options: [
      ['france', 'France'],
      ['union_europeenne', 'Union européenne'],
      ['royaume_uni', 'Royaume-Uni'],
      ['etats_unis', 'États-Unis'],
      ['asie', 'Asie'],
    ],
    many: true,
  },
  {
    id: 'positioning',
    label: 'Positionnement',
    options: [
      ['accessible', 'Accessible'],
      ['premium', 'Premium'],
      ['luxe', 'Luxe'],
    ],
  },
  {
    id: 'objective',
    label: 'Objectif',
    options: [
      ['se_differencier', 'Se différencier'],
      ['fideliser', 'Fidéliser'],
      ['produit_signature', 'Produit signature'],
    ],
  },
  {
    id: 'competition',
    label: 'Mise en concurrence',
    options: [
      ['seulement_givaudan', 'Seulement Givaudan'],
      ['autres_fournisseurs', 'D’autres fournisseurs aussi'],
      ['pas_decide', 'Pas encore décidé'],
    ],
  },
  {
    id: 'relation',
    label: 'Relation',
    options: [
      ['direct', 'En direct'],
      ['distributeur', 'Via un distributeur'],
      ['ne_sait_pas', 'Je ne sais pas'],
    ],
  },
  {
    id: 'commitments',
    label: 'Engagements',
    options: [
      ['naturel', 'Naturel'],
      ['vegan', 'Vegan'],
      ['sans_allergenes', 'Sans allergènes'],
      ['matieres_durables', 'Matières durables'],
    ],
    many: true,
  },
  {
    id: 'constraints',
    label: 'Contraintes',
    options: [
      ['delai_court', 'Délai court'],
      ['reglementation', 'Réglementation'],
      ['cout_matieres', 'Coût des matières'],
    ],
    many: true,
  },
];
const NUMBERS = [
  { id: 'budgetPerKg', label: 'Budget visé au kilo', unit: '€ / kg' },
  { id: 'annualVolumeKg', label: 'Volume annuel', unit: 'kg / an' },
];
const TOTAL = FIELDS.length + NUMBERS.length;

/* Le mot affiché pour une valeur du contrat : « etats_unis » → « États-Unis » */
export function labelOf(fieldId: string, value: string): string {
  const field = FIELDS.find(({ id }) => id === fieldId);
  return field?.options.find(([id]) => id === value)?.[1] ?? value;
}

/* Ce que l'API attend : des nombres pour le budget et le volume, et rien de vide */
export function toApiDetails(details: BriefDetails) {
  const sent: Record<string, number | string | string[]> = {};
  for (const [field, value] of Object.entries(details)) {
    if (!value.length) continue;
    const number = Number(String(value).replace(',', '.'));
    if (NUMBERS.some(({ id }) => id === field)) {
      if (Number.isFinite(number) && number >= 0) sent[field] = number;
    } else sent[field] = value;
  }
  return sent;
}

type Props = {
  guide: string;
  /* « olfactif » pour un parfum, « gustatif » pour un arôme */
  profile: string;
  /* « Produit : bougie. Ambiance : bord de mer. » */
  wishes: string;
  details: BriefDetails;
  onDetails: (details: BriefDetails) => void;
  onNext: () => void;
  onBack: () => void;
};

export function BriefStep({
  guide,
  profile,
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
        Votre projet est compris. Vous pouvez ajouter quelques précisions pour
        votre conseiller : un geste suffit pour chacune. Rien n’est obligatoire.
      </p>

      <h2 className={cn(smallLabel, 'mt-6')}>
        {/^[AEIOUH]/.test(guide) ? 'Ce qu’' : 'Ce que '}
        {guide} a entendu
      </h2>
      <dl className="mt-2 grid max-w-md grid-cols-[110px_1fr] gap-y-1 border-t border-line-strong pt-3 text-[16px]">
        {heard.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="first-letter:uppercase">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex items-baseline justify-between gap-4">
        <h2 className="text-[24px] font-semibold">
          Précisions pour votre conseiller
        </h2>
        <p
          role="status"
          aria-label="Précisions données"
          className="text-[15px]"
        >
          <span className="text-muted">Facultatif ·</span> {done} sur {TOTAL}
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
            {field.options.map(([option, text]) => {
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
                  {text}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button onClick={onNext} className={primaryButton}>
          Établir mon profil {profile}
          <ArrowRight className="size-4" />
        </button>
        <button onClick={onBack} className={linkButton}>
          Reprendre la séance
        </button>
      </div>
      <p className="mt-3 text-sm text-secondary">
        Votre conseiller recevra ce brief, avec vos précisions, quand vous
        demanderez votre plateau.
      </p>
    </div>
  );
}
