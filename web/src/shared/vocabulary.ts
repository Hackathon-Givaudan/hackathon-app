/* Les mots changent entre parfums et arômes, pas le parcours */
import type { Universe } from '../api';

export const VOCABULARY: Record<
  Universe,
  { label: string; expert: string; question: string; examples: string[] }
> = {
  parfum: {
    label: 'Parfum',
    expert: 'parfumeur',
    question: 'Quelle ambiance votre produit doit-il évoquer\u00a0?',
    examples: [
      'Une bougie qui rappelle le bord de mer, pour un moment d’évasion.',
      'Un gel douche d’été, joyeux, comme une terrasse au soleil.',
    ],
  },
  arome: {
    label: 'Arôme alimentaire',
    expert: 'aromaticien',
    question: 'Quel goût et quel moment imaginez-vous\u00a0?',
    examples: [
      'Une boisson protéinée gourmande et réconfortante, pour le dessert.',
      'Un yaourt d’été, fruité et joyeux, qui rappelle l’enfance.',
    ],
  },
};
