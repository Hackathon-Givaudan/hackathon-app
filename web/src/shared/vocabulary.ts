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

/* Une question du profil : deux réponses, chacune avec le mot du référentiel qu'elle ajoute */
export type Duel = { question: string; choices: [Choice, Choice] };
type Choice = { label: string; adds: string };

export const VOCABULARY: Record<
  Universe,
  {
    label: string;
    hint: string;
    expert: string;
    /* Les mots qui changent d'un univers à l'autre : le profil, la roue, le métier du guide */
    profile: string;
    wheel: string;
    /* Le métier du guide, au féminin puis au masculin */
    guides: [string, string];
    /* L'objet montré à l'écran, et son couvercle */
    object: string;
    lid: 'bouchon' | 'couvercle';
    /* Les mots du métier, expliqués là où ils apparaissent */
    noteHelp: string;
    tiers: Record<string, string>;
    /* Des projets types, pour qui ne sait pas par où commencer */
    examples: string[];
    /* Le profil : cinq questions à deux choix. Chaque réponse ajoute un mot du référentiel au brief */
    duels: Duel[];
    questions: Question[];
  }
> = {
  parfum: {
    label: 'Un parfum',
    hint: 'Bougie, soin, parfum d’ambiance…',
    expert: 'parfumeur',
    profile: 'olfactif',
    wheel: 'Votre roue olfactive',
    guides: ['Parfumeuse IA', 'Parfumeur IA'],
    object: 'flacon',
    lid: 'bouchon',
    noteHelp: 'Une note est une odeur qui compose votre création.',
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
    duels: [
      {
        question: 'Plutôt le matin ou le soir ?',
        choices: [
          { label: 'Le matin', adds: 'matin' },
          { label: 'Le soir', adds: 'soirée' },
        ],
      },
      {
        question: 'Plutôt l’été ou l’hiver ?',
        choices: [
          { label: 'L’été', adds: 'été' },
          { label: 'L’hiver', adds: 'hiver' },
        ],
      },
      {
        question: 'Plutôt le calme ou l’énergie ?',
        choices: [
          { label: 'Le calme', adds: 'calme' },
          { label: 'L’énergie', adds: 'énergie' },
        ],
      },
      {
        question: 'Plutôt le réconfort ou l’évasion ?',
        choices: [
          { label: 'Le réconfort', adds: 'réconfort' },
          { label: 'L’évasion', adds: 'évasion' },
        ],
      },
      {
        question: 'Plutôt l’élégance ou la joie ?',
        choices: [
          { label: 'L’élégance', adds: 'élégance' },
          { label: 'La joie', adds: 'joie' },
        ],
      },
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
    profile: 'gustatif',
    wheel: 'Votre roue des saveurs',
    guides: ['Aromaticienne IA', 'Aromaticien IA'],
    object: 'pot',
    lid: 'couvercle',
    noteHelp: 'Une note est une saveur qui compose votre création.',
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
    duels: [
      {
        question: 'Plutôt au goûter ou au dessert ?',
        choices: [
          { label: 'Au goûter', adds: 'goûter' },
          { label: 'Au dessert', adds: 'dessert' },
        ],
      },
      {
        question: 'Plutôt l’été ou l’hiver ?',
        choices: [
          { label: 'L’été', adds: 'été' },
          { label: 'L’hiver', adds: 'hiver' },
        ],
      },
      {
        question: 'Plutôt la gourmandise ou la fraîcheur ?',
        choices: [
          { label: 'La gourmandise', adds: 'gourmandise' },
          { label: 'La fraîcheur', adds: 'fraîcheur' },
        ],
      },
      {
        question: 'Plutôt le réconfort ou l’énergie ?',
        choices: [
          { label: 'Le réconfort', adds: 'réconfort' },
          { label: 'L’énergie', adds: 'énergie' },
        ],
      },
      {
        question: 'Plutôt la joie ou la nostalgie ?',
        choices: [
          { label: 'La joie', adds: 'joie' },
          { label: 'La nostalgie', adds: 'nostalgie' },
        ],
      },
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
