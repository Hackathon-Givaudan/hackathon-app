/* La roue du profil (écran 06 de la V3) : six axes, qui penchent selon les mots de la marque.
   Elle montre où penchent le brief et les réponses du profil : ce sont ces mots qui orientent le plateau.
   Pas de réglage à la main : un bouton qui ne changerait rien au plateau n'a pas sa place. */
import type { Universe } from '../api';
import { VOCABULARY } from '../shared/vocabulary';

/* Les six axes de la maquette pour chaque univers, avec ce qu'ils veulent dire */
const AXES: Record<Universe, [string, string][]> = {
  parfum: [
    ['Hespéridé', 'Les agrumes : frais, pétillants, lumineux.'],
    ['Marin', 'L’air iodé, l’eau et le sel.'],
    ['Aromatique', 'Les herbes : vertes et vivifiantes.'],
    ['Floral', 'Les fleurs : douces et lumineuses.'],
    ['Boisé', 'Les bois : ils donnent la structure.'],
    ['Ambré', 'Chaud et enveloppant, ce qui reste le plus longtemps.'],
  ],
  arome: [
    ['Acide', 'Ce qui pique et réveille le palais.'],
    ['Frais', 'La sensation de fraîcheur en bouche.'],
    ['Fruité', 'Le goût du fruit mûr.'],
    ['Sucré', 'La rondeur et la douceur.'],
    ['Umami', 'Le savoureux, le profond.'],
    ['Épicé', 'La chaleur et le piquant.'],
  ],
};

/* Chaque mot du brief ou du profil pousse un ou deux axes. C'est une lecture de l'équipe, à valider. */
const PUSHES: Record<Universe, Record<string, number[]>> = {
  parfum: {
    matin: [0],
    soirée: [5],
    été: [1, 0],
    hiver: [4, 5],
    calme: [2],
    énergie: [0],
    réconfort: [5],
    évasion: [1],
    élégance: [3],
    joie: [3],
    'bord de mer': [1],
    jardin: [2, 3],
  },
  arome: {
    goûter: [3],
    dessert: [3],
    été: [1, 2],
    hiver: [5],
    gourmandise: [3],
    fraîcheur: [1],
    réconfort: [3, 5],
    énergie: [0],
    joie: [2],
    nostalgie: [3],
  },
};

const BASE = 30;
const STEP = 20;
const clamp = (value: number) => Math.max(10, Math.min(95, value));

type Props = {
  universe: Universe;
  /* Le brief et les réponses du profil, en un seul texte */
  words: string;
};

export function ProfileWheel({ universe, words }: Props) {
  const axes = AXES[universe];
  const said = (word: string) =>
    new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, 'iu').test(words);
  const values = axes.map((_, index) =>
    clamp(
      BASE +
        STEP *
          Object.entries(PUSHES[universe]).filter(
            ([word, pushed]) => pushed.includes(index) && said(word),
          ).length,
    ),
  );
  /* Les deux axes qui dominent, pour dire le profil en une phrase */
  const top = axes
    .map(([name], index) => [name, values[index]] as const)
    // Seuls les axes que les mots de la marque ont poussés : un axe resté au repos ne dit rien d'elle
    .filter(([, value]) => value > BASE)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name.toLowerCase());

  const point = (index: number, radius: number) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 3;
    return `${(120 + radius * Math.cos(angle)).toFixed(1)},${(120 + radius * Math.sin(angle)).toFixed(1)}`;
  };
  return (
    <section aria-label={VOCABULARY[universe].wheel} className="mt-8">
      <h2 className="text-[20px] font-semibold">
        {VOCABULARY[universe].wheel}
      </h2>
      <p role="status" className="mt-1 text-[16px]">
        {top.length
          ? `Votre profil penche vers : ${top.join(' et ')}.`
          : 'Votre profil est encore neutre : répondez aux questions pour le préciser.'}
      </p>
      <div className="mt-3 grid items-center gap-6 sm:grid-cols-[240px_1fr]">
        <svg viewBox="0 0 240 240" role="img" aria-label="Roue à six axes">
          {[100, 66, 33].map((radius) => (
            <polygon
              key={radius}
              points={axes.map((_, index) => point(index, radius)).join(' ')}
              fill="none"
              stroke="var(--color-line-strong)"
            />
          ))}
          <polygon
            points={values.map((value, index) => point(index, value)).join(' ')}
            fill="var(--color-accent)"
            fillOpacity="0.28"
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
        </svg>
        <ul className="border-t border-line-strong">
          {axes.map(([name, meaning]) => (
            <li
              key={name}
              className="flex items-center gap-3 border-b border-line py-2"
            >
              <span className="flex-1">
                <span className="block font-semibold">{name}</span>
                <span className="block text-sm text-secondary">{meaning}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 max-w-[60ch] text-sm text-secondary">
        La roue montre où penchent les mots de votre brief et vos réponses. Ce
        sont eux qui orientent votre plateau.
      </p>
    </section>
  );
}
