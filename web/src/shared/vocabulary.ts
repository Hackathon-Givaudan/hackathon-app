/* Les mots et les questions changent entre parfums et arômes, pas le parcours.
   Les réponses proposées reprennent les étiquettes des références : le service les reconnaît. */
import type { Universe } from '../api';

export type Question = {
  id: string;
  /* Le mot qui précède la réponse dans le texte envoyé : « Produit : bougie. » */
  label: string;
  title: string;
  options: string[];
};

export const VOCABULARY: Record<
  Universe,
  {
    label: string;
    hint: string;
    expert: string;
    /* L'objet montré à l'écran, et son couvercle */
    object: string;
    lid: 'bouchon' | 'couvercle';
    /* Les mots du métier, expliqués là où ils apparaissent */
    noteHelp: string;
    tiers: Record<string, string>;
    /* Des projets types, pour qui ne sait pas par où commencer */
    examples: string[];
    questions: Question[];
  }
> = {
  parfum: {
    label: 'Un parfum',
    hint: 'Bougie, soin, parfum d’ambiance…',
    expert: 'parfumeur',
    object: 'flacon',
    lid: 'bouchon',
    noteHelp: 'Une note est une odeur qui compose votre parfum.',
    tiers: {
      Tête: 'ce que l’on sent en premier',
      Cœur: 'le caractère, qui s’installe',
      Fond: 'ce qui reste sur la durée',
    },
    examples: [
      'Une bougie pour un restaurant en bord de mer, fraîche et lumineuse',
      'Un savon premium pour un hôtel, élégant et apaisant',
      'Un diffuseur pour les soirées d’hiver, réconfortant',
    ],
    questions: [
      {
        id: 'product',
        label: 'Produit',
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
        label: 'Ambiance',
        title: 'Quelle ambiance ?',
        options: ['bord de mer', 'jardin', 'été', 'hiver', 'matin', 'soirée'],
      },
      {
        id: 'emotion',
        label: 'Émotion',
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
    object: 'pot',
    lid: 'couvercle',
    noteHelp: 'Une note est une saveur qui compose votre arôme.',
    tiers: {
      Dominante: 'le goût principal',
      Secondaires: 'ce qui l’accompagne',
      Finale: 'ce qui reste en bouche',
    },
    examples: [
      'Une boisson protéinée pour sportifs, gourmande et énergisante',
      'Un yaourt à la fraise pour le goûter, doux et gourmand',
      'Une glace pour l’été, très fraîche',
    ],
    questions: [
      {
        id: 'product',
        label: 'Produit',
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
        label: 'Ambiance',
        title: 'Pour quel moment ?',
        options: ['goûter', 'dessert', 'sport', 'été', 'hiver', 'matin'],
      },
      {
        id: 'emotion',
        label: 'Émotion',
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
