/* Entre l'atelier en ligne et les fioles en main : écrans 07, 07b, 08 et 08b de la V3.
   La marque choisit comment recevoir ses fioles, Karim valide, le plateau voyage, puis elle se prépare.
   Rien n'est envoyé pour de vrai : chaque passage simulé est un bouton « Démo ». */
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn, linkButton, primaryButton, smallLabel } from '../shared/ui';

type Phase = 'offer' | 'validation' | 'shipping' | 'back';
type Props = {
  vials: number;
  guide: string;
  /* « Partir de parfums existants », ou d'arômes */
  existing: string;
  onArrived: () => void;
  onBack: () => void;
};

const PREPARE = [
  'Le plateau ouvert, les fioles rangées par numéro',
  'Les mouillettes du plateau à portée de main',
  'Un café, pour reposer le nez entre deux fioles',
  'Un endroit calme, pour la séance à l’écrit',
];
const SLOTS = ['Jeu. 10 h', 'Jeu. 17 h', 'Ven. 9 h 30', 'Ven. 14 h'];
const DELAYS = [
  ['Formule de la banque', 'Environ un mois jusqu’à la commande'],
  ['Création sur mesure', 'Plusieurs mois, six en moyenne'],
  ['Votre plateau de fioles', 'Livré en [X] jours'],
];

/* Une frise d'étapes : celles déjà passées sont soulignées en bronze */
function Timeline({ stages, done }: { stages: string[][]; done: number }) {
  return (
    <ol className="mt-6 grid gap-2 sm:grid-cols-4">
      {stages.map(([stage, text], index) => (
        <li
          key={stage}
          className={cn(
            'border-t-2 pt-2',
            index < done ? 'border-accent' : 'border-line opacity-60',
          )}
        >
          <span className="block text-[16px] font-semibold">{stage}</span>
          <span className="block text-sm text-secondary">{text}</span>
        </li>
      ))}
    </ol>
  );
}

export function DeliveryStep({
  vials,
  guide,
  existing,
  onArrived,
  onBack,
}: Props) {
  const [phase, setPhase] = useState<Phase>('offer');
  const [offer, setOffer] = useState(0);
  const [ready, setReady] = useState([true, false, false, false]);
  const [slot, setSlot] = useState('');

  /* Les trois offres de la maquette. La première est celle que le conseiller recommande. */
  const offers = [
    {
      title: 'Recevoir un plateau sur mesure',
      sub: `${vials} notes choisies pour vous, livrées chez vous`,
      badge: 'Recommandé par votre conseiller',
      text: `Comme à l’atelier : vous recevez vos fioles et vous les sentez avec ${guide}.`,
      cta: `Recevoir mon plateau · ${vials} fioles`,
      next: 'validation' as const,
    },
    {
      title: 'Utiliser mon kit atelier',
      sub: 'Vous avez déjà le coffret de notes de base : on commence tout de suite',
      badge: 'Si vous l’avez déjà',
      text: `${guide} pioche dans vos notes de base. Pas d’attente : on sent tout de suite.`,
      cta: 'J’ouvre mon kit, on commence',
      next: null,
    },
    {
      title: existing,
      sub: 'Des échantillons de créations Givaudan proches de votre profil',
      badge: 'Le plus rapide',
      text: `${guide} choisit des formules de la banque proches de votre profil. Moins de sur-mesure, plus rapide.`,
      cta: 'Recevoir mes échantillons',
      next: 'validation' as const,
    },
  ];
  const chosen = offers[offer];

  if (phase === 'offer') {
    return (
      <div className="mt-auto pb-6 pt-10">
        <p className={smallLabel}>Votre plateau</p>
        <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
          Votre parcours se fait en deux temps.
        </h1>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          <li className="border-t-2 border-accent pt-2">
            <span className="block font-semibold">
              1 · En ligne, avec {guide}
            </span>
            <span className="text-sm text-secondary">
              Projet, brief et profil : c’est fait
            </span>
          </li>
          <li className="border-t-2 border-line pt-2">
            <span className="block font-semibold">2 · Les fioles en main</span>
            <span className="text-sm text-secondary">
              On sent ensemble, puis votre formule
            </span>
          </li>
        </ol>

        <h2 className="mt-8 text-[20px] font-semibold">
          Choisissez comment recevoir vos fioles :
        </h2>
        <div className="mt-3 grid gap-3">
          {offers.map(({ title, sub, badge }, index) => (
            <button
              key={title}
              onClick={() => setOffer(index)}
              aria-pressed={offer === index}
              className={cn(
                'rounded-xl border border-line-input bg-card px-4 py-3 text-left hover:bg-soft',
                offer === index && 'bg-selected ring-2 ring-accent',
              )}
            >
              <span className={smallLabel}>{badge}</span>
              <span className="block text-[18px] font-semibold">{title}</span>
              <span className="block text-[15px] text-secondary">{sub}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 max-w-[56ch] text-[16px]">{chosen.text}</p>
        <p className="mt-2 max-w-[56ch] text-sm text-secondary">
          Karim, votre conseiller Givaudan, a étudié votre brief et vous
          recommande la première offre. Les autres restent possibles après un
          échange avec lui.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <button
            onClick={() => (chosen.next ? setPhase(chosen.next) : onArrived())}
            className={primaryButton}
          >
            {chosen.cta}
            <ArrowRight className="size-4" />
          </button>
          <button onClick={onBack} className={linkButton}>
            Revenir au profil
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'validation') {
    return (
      <div className="mt-auto pb-6 pt-10">
        <p className={smallLabel}>Statut de votre demande</p>
        <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
          Karim vérifie votre demande.
        </h1>
        <Timeline
          done={1}
          stages={[
            ['Vérification', 'Par Karim, votre conseiller'],
            ['Préparation', 'Par nos équipes'],
            ['Expédition', 'Après validation'],
            ['Livraison', 'Chez vous'],
          ]}
        />
        <dl className="mt-6 grid max-w-md grid-cols-[150px_1fr] gap-y-2 border-t border-line pt-4 text-[16px]">
          <dt className="text-muted">Offre</dt>
          <dd>{chosen.title}</dd>
          <dt className="text-muted">Réponse de Karim</dt>
          <dd>Sous [X] jours ouvrés</dd>
          <dt className="text-muted">Adresse</dt>
          <dd>Atelier Maison Lumen, Biarritz</dd>
        </dl>
        <p className="mt-4 max-w-[56ch] text-[16px]">
          Karim vérifie votre brief, le contenu du plateau et son coût. Vous
          recevez un e-mail dès qu’il valide.
        </p>

        <h2 className="mt-8 text-[20px] font-semibold">
          À quoi s’attendre ensuite
        </h2>
        <dl className="mt-2 border-t border-line-strong">
          {DELAYS.map(([what, delay]) => (
            <div
              key={what}
              className="grid gap-x-4 border-b border-line py-2 sm:grid-cols-[220px_1fr]"
            >
              <dt className="font-semibold">{what}</dt>
              <dd className="text-secondary">{delay}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-sm text-secondary">
          Délais indicatifs. Karim vous confirme le vôtre.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <button
            onClick={() => setPhase('shipping')}
            className={primaryButton}
          >
            Démo : Karim a validé le plateau
            <ArrowRight className="size-4" />
          </button>
          <button onClick={() => setPhase('offer')} className={linkButton}>
            Changer d’offre
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'shipping') {
    return (
      <div className="mt-auto pb-6 pt-10">
        <p className={smallLabel}>Suivi de votre livraison</p>
        <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
          Votre plateau arrive.
        </h1>
        <Timeline
          done={3}
          stages={[
            ['Validé', 'Par Karim, votre conseiller'],
            ['Préparé', 'Par nos équipes'],
            ['En route', 'Expédié'],
            ['Livré', 'Chez vous, sous [X] jours'],
          ]}
        />
        <dl className="mt-6 grid max-w-md grid-cols-[150px_1fr] gap-y-2 border-t border-line pt-4 text-[16px]">
          <dt className="text-muted">Transporteur</dt>
          <dd>[X]</dd>
          <dt className="text-muted">Numéro de suivi</dt>
          <dd>[X]</dd>
        </dl>
        <p className="mt-4 max-w-[56ch] text-[16px]">
          Votre atelier est enregistré. Quand le plateau arrive, nous vous
          envoyons un e-mail : reconnectez-vous et vous reprendrez là où vous
          vous êtes arrêtée.
        </p>
        <div className="mt-6">
          <button onClick={() => setPhase('back')} className={primaryButton}>
            Démo : le plateau est arrivé, je me reconnecte
            <ArrowRight className="size-4" />
          </button>
        </div>
        <p className="mt-4 text-[13px] text-muted">
          Prototype : aucun plateau n’est réellement envoyé.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>Bon retour, Léa</p>
      <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
        Votre plateau est arrivé.
      </h1>
      <p className="mt-3 max-w-[56ch] text-[17px] leading-snug">
        Tout est prêt pour la deuxième partie de l’atelier : sentir vos fioles
        avec {guide}, puis composer votre formule.
      </p>

      <div className="mt-6 flex items-baseline justify-between gap-4">
        <h2 className="text-[20px] font-semibold">Préparez-vous</h2>
        <p role="status" aria-label="Préparation" className="text-[15px]">
          {ready.filter(Boolean).length} sur {PREPARE.length} prêts
        </p>
      </div>
      <ul className="mt-2 border-t border-line-strong">
        {PREPARE.map((item, index) => (
          <li key={item} className="border-b border-line">
            <label className="flex min-h-12 cursor-pointer items-center gap-3 text-[16px]">
              <input
                type="checkbox"
                checked={ready[index]}
                onChange={() =>
                  setReady(ready.map((is, at) => (at === index ? !is : is)))
                }
                className="size-5 accent-[var(--color-accent)]"
              />
              {item}
            </label>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-[20px] font-semibold">
        Quand voulez-vous sentir vos fioles ?
      </h2>
      <div className="mt-3">
        <button onClick={onArrived} className={primaryButton}>
          Commencer maintenant avec {guide}
          <ArrowRight className="size-4" />
        </button>
      </div>
      <p className={cn(smallLabel, 'mt-5')}>Ou réservez un créneau :</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SLOTS.map((label) => (
          <button
            key={label}
            onClick={() => setSlot(label)}
            aria-pressed={slot === label}
            className={cn(
              'min-h-11 rounded-full border border-line-strong px-4 text-[15px]',
              slot === label
                ? 'bg-selected ring-2 ring-accent'
                : 'hover:bg-soft',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {slot && (
        <p className="mt-3 text-[15px]">
          C’est noté pour {slot}. Prototype : aucun rappel n’est réellement
          envoyé.
        </p>
      )}
    </div>
  );
}
