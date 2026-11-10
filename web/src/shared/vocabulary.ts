/* Les mots et les questions changent entre parfums et arômes, pas le parcours.
   Les réponses proposées reprennent les étiquettes des références : le service les reconnaît. */
import type { Universe } from '../api';

export type Question = { id: string; title: string; options: string[] };

export const VOCABULARY: Record<
  Universe,
  { label: string; hint: string; expert: string; questions: Question[] }
> = {
  parfum: {
    label: 'Un parfum',
    hint: 'Bougie, soin, parfum d’ambiance…',
    expert: 'parfumeur',
    questions: [
      {
        id: 'product',
        title: 'Pour quel produit ?',
        options: [
          'bougie',
          'diffuseur',
          'body mist',
          'savon',
          'gel douche',
          'parfum',
        ],
      },
      {
        id: 'mood',
        title: 'Quelle ambiance ?',
        options: ['bord de mer', 'jardin', 'été', 'hiver', 'matin', 'soirée'],
      },
      {
        id: 'emotion',
        title: 'Quelle émotion doit-il laisser ?',
        options: [
          'évasion',
          'réconfort',
          'joie',
          'calme',
          'élégance',
          'énergie',
        ],
      },
    ],
  },
  arome: {
    label: 'Un arôme alimentaire',
    hint: 'Boisson, yaourt, pâtisserie…',
    expert: 'aromaticien',
    questions: [
      {
        id: 'product',
        title: 'Pour quel produit ?',
        options: [
          'boisson protéinée',
          'yaourt',
          'barre',
          'confiserie',
          'glace',
          'pâtisserie',
        ],
      },
      {
        id: 'mood',
        title: 'Pour quel moment ?',
        options: ['goûter', 'dessert', 'sport', 'été', 'hiver', 'matin'],
      },
      {
        id: 'emotion',
        title: 'Quelle sensation doit-il laisser ?',
        options: [
          'gourmandise',
          'fraîcheur',
          'énergie',
          'réconfort',
          'joie',
          'nostalgie',
        ],
      },
    ],
  },
};
