/* Fin du parcours : la formule est acceptée, la marque sait ce qui suit */
import type { Formula } from '../api';
import { primaryButton, smallLabel } from '../shared/ui';

type Props = { formula: Formula; expert: string; onRestart: () => void };

export function AcceptedStep({ formula, expert, onRestart }: Props) {
  const next = [
    [
      'Aujourd’hui',
      'Votre brief et vos notes validées sont transmis, vous n’aurez rien à répéter.',
    ],
    ['Ensuite', `Un échantillon de ${formula.name} vous est préparé.`],
    ['Après l’essai', `Votre ${expert} ajuste la formule avec vous si besoin.`],
  ];
  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>Formule acceptée</p>
      <h1 className="f-display mt-1 text-[52px] leading-[1.05] md:text-[64px]">
        {formula.name} est à vous.
      </h1>

      <ol className="mt-8 border-t border-white/45">
        {next.map(([when, what]) => (
          <li
            key={when}
            className="grid gap-1 border-b border-white/25 py-3 sm:grid-cols-[140px_1fr]"
          >
            <span className={smallLabel}>{when}</span>
            <span className="text-[16px]">{what}</span>
          </li>
        ))}
      </ol>
      <p className="mono mt-3 text-[11px] opacity-80">
        Démonstration : aucun échantillon n’est réellement envoyé.
      </p>

      <button onClick={onRestart} className={`${primaryButton} mt-6`}>
        Démarrer un autre projet
      </button>
    </div>
  );
}
