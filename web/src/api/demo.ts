/* Mode démonstration : mêmes gestes que l'API, calculés dans le navigateur
   à partir des références fictives du Product (api/data/references.json).
   Sert tant que les routes du contrat ne sont pas codées dans api/. */
import references from './data/references.json';
import type { Api, Brief, Formula, Note, Universe } from './types';

type Reference = (typeof references)[number];

const briefs = new Map<number, Brief>();
const formulas = new Map<number, Formula>();

/* « Fleur d'oranger » → « fleur-d-oranger » */
const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/* Mots utiles d'un texte, sans accents ni mots courts */
const words = (text: string) =>
  slug(text)
    .split('-')
    .filter((word) => word.length > 3);

const noteLabels = (reference: Reference) =>
  reference.tiers.flatMap((tier) => tier.notes);

/* Combien de mots des envies se retrouvent dans la fiche de la référence */
function matchWishes(reference: Reference, wishes: string) {
  const sheet = new Set(
    words(
      [
        reference.name,
        reference.family,
        ...reference.moods,
        ...reference.emotions,
        ...reference.uses,
        ...noteLabels(reference),
      ].join(' '),
    ),
  );
  return words(wishes).filter((word) => sheet.has(word)).length;
}

/* Le temps de réponse simulé, pour que l'attente se voie à l'écran. Nul pendant les tests. */
const delay = import.meta.env.MODE === 'test' ? 0 : 600;
const pause = () => new Promise((resolve) => setTimeout(resolve, delay));

function findBrief(briefId: number) {
  const brief = briefs.get(briefId);
  if (!brief) throw new Error('Brief introuvable');
  return brief;
}

export const demoApi: Api = {
  async createBrief(universe: Universe, wishes: string) {
    await pause();
    const ranked = references
      .filter((reference) => reference.universe === universe)
      .map((reference) => ({
        reference,
        score: matchWishes(reference, wishes),
      }))
      .sort((a, b) => b.score - a.score);
    if (ranked[0].score === 0) {
      throw new Error(
        'Nous n’avons pas reconnu votre projet. Ajoutez une ambiance, un usage ou une émotion.',
      );
    }
    const proposedNotes: Note[] = [];
    for (const { reference, score } of ranked.slice(0, 3)) {
      if (score === 0) continue;
      const clue = [...reference.moods, ...reference.emotions].find((mood) =>
        words(mood).some((word) => words(wishes).includes(word)),
      );
      for (const label of noteLabels(reference)) {
        if (
          proposedNotes.length >= 6 ||
          proposedNotes.some((note) => note.id === slug(label))
        )
          continue;
        proposedNotes.push({
          id: slug(label),
          label,
          family: reference.family,
          reason: clue
            ? `Évoque « ${clue} »`
            : `Proche de l’univers ${reference.family.toLowerCase()}`,
        });
      }
    }
    const brief: Brief = {
      id: briefs.size + 1,
      universe,
      wishes,
      status: 'notes_proposed',
      proposedNotes,
      validatedNotes: [],
      createdAt: new Date().toISOString(),
    };
    briefs.set(brief.id, brief);
    return brief;
  },

  async validateNotes(briefId, noteIds) {
    await pause();
    const brief = findBrief(briefId);
    const validatedNotes = brief.proposedNotes.filter((note) =>
      noteIds.includes(note.id),
    );
    if (validatedNotes.length === 0)
      throw new Error('Gardez au moins une note.');
    const updated: Brief = {
      ...brief,
      validatedNotes,
      status: 'notes_validated',
    };
    briefs.set(briefId, updated);
    formulas.delete(briefId);
    return updated;
  },

  async proposeFormula(briefId) {
    await pause();
    const brief = findBrief(briefId);
    if (brief.validatedNotes.length === 0) {
      throw new Error('Validez les notes avant de demander une formule');
    }
    const known = formulas.get(briefId);
    if (known) return known;

    const wanted = new Set(brief.validatedNotes.map((note) => note.id));
    const shared = (reference: Reference) =>
      noteLabels(reference).filter((label) => wanted.has(slug(label)));
    const best = references
      .filter((reference) => reference.universe === brief.universe)
      .sort(
        (a, b) =>
          shared(b).length - shared(a).length ||
          matchWishes(b, brief.wishes) - matchWishes(a, brief.wishes),
      )[0];

    /* Parts illustratives : chaque niveau pèse pareil, puis on arrondit à 100 */
    const labels = noteLabels(best);
    const removed = brief.proposedNotes
      .filter(
        (note) =>
          !wanted.has(note.id) &&
          labels.some((label) => slug(label) === note.id),
      )
      .map((note) => note.label);
    const share = Math.floor(100 / labels.length);
    const formula: Formula = {
      id: best.id,
      name: best.name,
      notes: labels.map((label, index) => ({
        note: {
          id: slug(label),
          label,
          family: best.tiers.find((tier) => tier.notes.includes(label))!.tier,
        },
        share: index === 0 ? 100 - share * (labels.length - 1) : share,
      })),
      explanation: `Elle réunit ${shared(best).join(', ')}, que vous avez validé${shared(best).length > 1 ? 's' : ''}, dans un accord ${best.family.toLowerCase()}. Convient pour : ${best.uses.join(', ')}.${removed.length ? ` Elle contient aussi ${removed.join(', ')}, que vous aviez écarté : dites-le à l’essai.` : ''}`,
      source: best.source,
    };
    formulas.set(briefId, formula);
    briefs.set(briefId, { ...brief, status: 'formula_proposed' });
    return formula;
  },

  async acceptFormula(briefId) {
    await pause();
    const brief = findBrief(briefId);
    if (!formulas.has(briefId)) throw new Error('Aucune formule à accepter');
    const updated: Brief = { ...brief, status: 'formula_accepted' };
    briefs.set(briefId, updated);
    return updated;
  },
};
