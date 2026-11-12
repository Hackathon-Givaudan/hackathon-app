/* Les précisions du brief et le retour après essai : ce que le contrat accepte.
   Les valeurs permises sont celles de ia/data/modele_brief.json, recopiées ici comme dans
   openapi.yaml. C'est une copie : si le modèle de brief change, ces listes changent aussi. */
import { isRecord } from './ia.js';

const ONE: Record<string, string[]> = {
  projectType: ['creation', 'reformulation', 'extension_gamme'],
  target: ['clientele_boutiques', 'grand_public', 'hotellerie'],
  positioning: ['accessible', 'premium', 'luxe'],
  objective: ['se_differencier', 'fideliser', 'produit_signature'],
  competition: ['seulement_givaudan', 'autres_fournisseurs', 'pas_decide'],
  relation: ['direct', 'distributeur', 'ne_sait_pas'],
};
const MANY: Record<string, string[]> = {
  salesCountries: [
    'france',
    'union_europeenne',
    'royaume_uni',
    'etats_unis',
    'asie',
  ],
  commitments: ['naturel', 'vegan', 'sans_allergenes', 'matieres_durables'],
  constraints: ['delai_court', 'reglementation', 'cout_matieres'],
};
const NUMBERS = ['budgetPerKg', 'annualVolumeKg'];

export type BriefDetails = Record<string, number | string | string[]>;

const distinct = (values: unknown[]) => new Set(values).size === values.length;

/* Les précisions si elles suivent le contrat, sinon la phrase qui dit ce qui ne va pas */
export function readDetails(body: unknown): BriefDetails | string {
  if (!isRecord(body)) return 'Précisions invalides';
  const details: BriefDetails = {};
  for (const [field, value] of Object.entries(body)) {
    if (NUMBERS.includes(field)) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        return `Nombre invalide : ${field}`;
      }
      details[field] = value;
    } else if (field in ONE) {
      if (typeof value !== 'string' || !ONE[field].includes(value)) {
        return `Valeur inconnue pour ${field}`;
      }
      details[field] = value;
    } else if (field in MANY) {
      if (
        !Array.isArray(value) ||
        !distinct(value) ||
        !value.every(
          (item) => typeof item === 'string' && MANY[field].includes(item),
        )
      ) {
        return `Valeur inconnue pour ${field}`;
      }
      details[field] = value as string[];
    } else {
      return `Champ inconnu : ${field}`;
    }
  }
  return details;
}

const ADJUSTMENTS = [
  'plus_de_fraicheur',
  'plus_de_tenue',
  'plus_doux',
  'parfait',
];

/* Les ajustements demandés après l'essai, ou la phrase qui dit ce qui ne va pas */
export function readFeedback(body: unknown): string[] | string {
  const chosen: unknown = isRecord(body) ? body.adjustments : undefined;
  if (
    !Array.isArray(chosen) ||
    chosen.length === 0 ||
    !distinct(chosen) ||
    !chosen.every(
      (item) => typeof item === 'string' && ADJUSTMENTS.includes(item),
    )
  ) {
    return 'Choisissez au moins un ajustement de la liste';
  }
  if (chosen.includes('parfait') && chosen.length > 1) {
    return '« parfait » ne se combine avec aucun autre ajustement';
  }
  return chosen as string[];
}
