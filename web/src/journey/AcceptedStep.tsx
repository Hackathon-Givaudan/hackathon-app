/* Le suivi et le rappel (écrans 11 et 12 de la V3) : la création prend forme, la marque voit ses
   matières et son devis, reçoit son échantillon, puis demande ses derniers ajustements.
   Aucun échantillon ne part et aucune commande n'est passée : chaque passage simulé le dit. */
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Formula } from '../api';
import { cn, linkButton, primaryButton, smallLabel } from '../shared/ui';

type Props = {
  formula: Formula;
  /* Le nom donné par la marque, sinon celui de la référence */
  name: string;
  expert: string;
  guide: string;
  onRestart: () => void;
};

const STAGES = [
  'Composée',
  'Demande envoyée',
  'Échantillon reçu',
  'Retour donné',
];
/* Les ajustements de la maquette. Le dernier exclut les autres. */
const ADJUSTMENTS = [
  'Plus de fraîcheur en tête',
  'Plus de tenue le soir',
  'Plus doux',
];
const PERFECT = 'Parfait comme ça';
/* Givaudan n'a donné ni prix ni délai : ils restent [X], comme dans la maquette */
const QUOTE = [
  ['Prix au kilo', '[X] €'],
  ['Total estimé', '[X] €'],
  ['Livraison', '[X] semaines après accord'],
];
const pill =
  'min-h-12 rounded-full border border-line-strong px-4 text-[16px] hover:bg-soft';

export function AcceptedStep({
  formula,
  name,
  expert,
  guide,
  onRestart,
}: Props) {
  const [received, setReceived] = useState(false);
  const [adjustments, setAdjustments] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [asked, setAsked] = useState(false);
  const [ordered, setOrdered] = useState(false);
  /* L'origine de chaque matière, quand sa fiche la donne */
  const [origins, setOrigins] = useState<Record<string, string>>({});
  const reached = adjustments.length ? 3 : received ? 2 : 1;

  useEffect(() => {
    let current = true;
    void Promise.all(
      formula.notes.map(({ note }) =>
        api
          .material(note.id)
          .catch(() => null)
          .then((sheet) => [note.id, sheet?.origin ?? ''] as const),
      ),
    ).then((found) => current && setOrigins(Object.fromEntries(found)));
    return () => {
      current = false;
    };
  }, [formula]);

  function adjust(choice: string) {
    setOrdered(false);
    if (choice === PERFECT) {
      return setAdjustments(adjustments.includes(PERFECT) ? [] : [PERFECT]);
    }
    const others = adjustments.filter((kept) => kept !== PERFECT);
    setAdjustments(
      others.includes(choice)
        ? others.filter((kept) => kept !== choice)
        : [...others, choice],
    );
  }
  const changes = adjustments.filter((kept) => kept !== PERFECT);

  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>{name}</p>
      <h1 className="f-display mt-1 text-[48px] leading-[1.05] md:text-[60px]">
        {received
          ? 'Vous l’avez reçu. Comment vit-elle chez vous ?'
          : `${name} prend forme.`}
      </h1>

      <ol
        aria-label="Suivi"
        className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {STAGES.map((stage, index) => (
          <li
            key={stage}
            aria-current={index === reached ? 'step' : undefined}
            className={cn(
              'border-t-2 pt-2 text-sm',
              index <= reached ? 'border-ink' : 'border-line opacity-55',
            )}
          >
            <span className="mr-2 text-[12px] text-muted">{index + 1}</span>
            {stage}
          </li>
        ))}
      </ol>

      {!received ? (
        <>
          <ul className="mt-6 border-t border-line-strong text-[16px]">
            <li className="border-b border-line py-3">
              Votre projet et vos notes sont transmis : vous n’aurez rien à
              répéter.
            </li>
            <li className="border-b border-line py-3">
              Un échantillon de {name} vous est préparé. Délai : [X].
            </li>
            <li className="border-b border-line py-3">
              Votre {expert} ajuste la formule avec vous après l’essai.
            </li>
          </ul>

          <h2 className="mt-8 text-[20px] font-semibold">
            Vos matières premières
          </h2>
          <ul className="mt-2 border-t border-line-strong">
            {formula.notes.map(({ note }) => (
              <li
                key={note.id}
                className="grid gap-x-4 border-b border-line py-2 sm:grid-cols-[200px_1fr]"
              >
                <span className="font-semibold first-letter:uppercase">
                  {note.label}
                </span>
                <span className="text-secondary">
                  {origins[note.id] || 'Origine : [X]'}
                </span>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 text-[20px] font-semibold">Votre devis</h2>
          <p className="text-sm text-secondary">
            Envoyé par Karim · valable [X] jours
          </p>
          <dl className="mt-2 grid max-w-md grid-cols-[150px_1fr] gap-y-2 border-t border-line-strong pt-3 text-[16px]">
            {QUOTE.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setAccepted(!accepted)}
              aria-pressed={accepted}
              className={cn(pill, accepted && 'bg-selected')}
            >
              {accepted
                ? 'Devis accepté, Karim lance la production'
                : 'Accepter le devis'}
            </button>
            <button
              onClick={() => setAsked(!asked)}
              aria-pressed={asked}
              className={cn(pill, asked && 'bg-selected')}
            >
              {asked
                ? 'Question envoyée à Karim'
                : 'Poser une question à Karim'}
            </button>
          </div>
          <p className="mt-3 max-w-[56ch] text-sm text-secondary">
            Prix ferme après le contrôle réglementaire. Votre formule reste
            gardée pour les recommandes.
          </p>

          <button
            onClick={() => setReceived(true)}
            className={`${primaryButton} mt-6`}
          >
            Simuler la réception de l’échantillon
          </button>
        </>
      ) : (
        <>
          <h2 className="mt-6 text-[20px] font-semibold">
            Derniers ajustements
          </h2>
          <p className="text-[15px] text-secondary">
            Dites à {guide} ce qu’il faut retoucher. Plusieurs réponses
            possibles.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...ADJUSTMENTS, PERFECT].map((choice) => (
              <button
                key={choice}
                onClick={() => adjust(choice)}
                aria-pressed={adjustments.includes(choice)}
                className={cn(
                  pill,
                  adjustments.includes(choice) &&
                    'bg-selected ring-2 ring-accent',
                )}
              >
                {choice}
              </button>
            ))}
          </div>
          {adjustments.length > 0 && (
            <>
              <p className="mt-5 text-[17px]">
                Votre retour est noté.{' '}
                {changes.length
                  ? `Nouvelle version : ${changes.join(', ').toLowerCase()}.`
                  : 'On garde cette version, sans retouche.'}
              </p>
              <p className={cn(smallLabel, 'mt-4')}>Ce que reçoit Karim</p>
              <p className="text-[15px]">
                {name} ·{' '}
                {changes.length
                  ? changes.join(', ').toLowerCase()
                  : 'validée telle quelle'}
              </p>
              <button
                onClick={() => setOrdered(!ordered)}
                aria-pressed={ordered}
                className={cn(primaryButton, 'mt-4')}
              >
                {ordered
                  ? 'Commande transmise à Karim'
                  : 'Commander cette version'}
              </button>
            </>
          )}
        </>
      )}

      <p className="mt-5 max-w-[60ch] text-[13px] text-muted">
        Prototype : aucun échantillon n’est envoyé, aucun devis ni commande
        n’est réellement transmis, et le retour n’arrive pas encore au
        conseiller.
      </p>
      <button onClick={onRestart} className={`${linkButton} mt-3`}>
        Démarrer un autre projet
      </button>
    </div>
  );
}
