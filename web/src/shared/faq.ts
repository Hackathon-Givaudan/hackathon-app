/* L'aide : Aurore ne répond qu'avec ces réponses, écrites et validées par l'équipe.
   Une question qui n'en trouve aucune reçoit REFUSAL. Aucun texte n'est rédigé par un modèle. */

export const REFUSAL =
  'Je ne peux pas répondre à cela. Je peux vous aider sur votre projet de parfum ou d’arôme.';

type Entry = { question: string; words: string[]; answer: string };

export const FAQ: Entry[] = [
  {
    question: 'Comment se passe la séance ?',
    words: ['seance', 'aurore', 'conversation', 'marche'],
    answer:
      'Vous échangez par écrit avec Aurore. Elle note ce qu’elle entend, avec vos mots, et vous pouvez retirer ce qui ne vous ressemble pas.',
  },
  {
    question: 'Quand vais-je recevoir mon échantillon ?',
    words: ['echantillon', 'recevoir', 'delai', 'livraison', 'quand', 'temps'],
    answer:
      'Le délai n’est pas encore fixé : [X]. Votre conseiller Givaudan vous le confirme après votre demande.',
  },
  {
    question: 'Combien cela coûte-t-il ?',
    words: ['prix', 'cout', 'coute', 'tarif', 'payer'],
    answer:
      'Le prix dépend de votre projet : [X]. Votre conseiller Givaudan vous l’indique.',
  },
  {
    question: 'Puis-je changer d’avis sur ma formule ?',
    words: ['modifier', 'changer', 'ajuster', 'avis', 'formule'],
    answer:
      'Oui. Revenez à votre plateau, changez d’avis sur une fiole, puis demandez une nouvelle proposition.',
  },
  {
    question: 'Qu’est-ce qu’une note ?',
    words: ['note', 'notes', 'tete', 'coeur', 'fond'],
    answer:
      'Une note est une odeur ou une saveur qui compose votre création. La tête se sent d’abord, le cœur s’installe, le fond reste.',
  },
];

/* Les mots d'une question, sans accents ni ponctuation */
const words = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/* La réponse validée dont le plus de mots figurent dans la question, ou le refus */
export function answerTo(question: string): string {
  const asked = words(question);
  const scored = FAQ.map((entry) => ({
    entry,
    score: entry.words.filter((word) => asked.includes(word)).length,
  })).sort((a, b) => b.score - a.score);
  return scored[0].score > 0 ? scored[0].entry.answer : REFUSAL;
}
