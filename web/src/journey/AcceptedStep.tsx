/* Fin du parcours : la demande d'échantillon est enregistrée, la marque sait ce qui suit */
import type { Formula } from '../api';
import { primaryButton, smallLabel } from '../shared/ui';

type Props = { formula: Formula; expert: string; onRestart: () => void };

export function AcceptedStep({ formula, expert, onRestart }: Props) {
  const next = [
    [
      'Aujourd’hui',
      'Votre projet et vos notes sont transmis : vous n’aurez rien à répéter.',
    ],
    ['Ensuite', `Un échantillon de ${formula.name} vous est préparé.`],
    ['Après l’essai', `Votre ${expert} ajuste la formule avec vous si besoin.`],
  ];
  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>Demande d’échantillon enregistrée</p>
      <h1 className="f-display mt-1 text-[52px] leading-[1.05] md:text-[64px]">
        {formula.name} part à l’essai.
      </h1>

      <ol className="mt-8 border-t border-white/45">
        {next.map(([when, what], index) => (
          <li
            key={when}
            className="grid grid-cols-[32px_1fr] gap-x-3 border-b border-white/25 py-3 sm:grid-cols-[32px_130px_1fr]"
          >
            <span className="mono grid size-6 place-items-center border border-white/60 text-[11px]">
              {index + 1}
            </span>
            <span className={smallLabel}>{when}</span>
            <span className="col-start-2 text-[16px] sm:col-start-3">
              {what}
            </span>
          </li>
        ))}
      </ol>
      <p className="mono mt-3 text-[11px] opacity-80">
        Prototype : aucun échantillon n’est réellement envoyé.
      </p>

      <button onClick={onRestart} className={`${primaryButton} mt-6`}>
        Démarrer un autre projet
      </button>
    </div>
  );
}
