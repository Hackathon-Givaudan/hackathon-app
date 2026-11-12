/* L'espace du conseiller Givaudan (écrans business de la V3) : le tableau de bord des briefs reçus,
   puis, pour un brief, ce que la marque a dit, ses précisions, son retour et le potentiel estimé.
   Le potentiel est une hypothèse calculée par des règles écrites : le conseiller décide. */
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Brief, Potential } from '../api';
import { FIELDS, labelOf } from '../journey/BriefStep';
import {
  cn,
  errorText,
  linkButton,
  primaryButton,
  smallLabel,
} from '../shared/ui';
import { day, STATUS } from './SpaceView';

const VERDICT: Record<Potential['criteria'][number]['status'], string> = {
  favorable: 'Favorable',
  a_verifier: 'À vérifier',
  a_completer: 'À compléter',
};
const FEEDBACK: Record<string, string> = {
  plus_de_fraicheur: 'plus de fraîcheur',
  plus_de_tenue: 'plus de tenue',
  plus_doux: 'plus doux',
  parfait: 'parfait comme ça',
};
const NUMBERS: [string, string, string][] = [
  ['budgetPerKg', 'Budget visé au kilo', '€ / kg'],
  ['annualVolumeKg', 'Volume annuel', 'kg / an'],
];

export function AdvisorView({ onBack }: { onBack: () => void }) {
  const [briefs, setBriefs] = useState<Brief[]>();
  const [opened, setOpened] = useState<Brief>();
  const [potential, setPotential] = useState<Potential>();
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listBriefs()
      .then(setBriefs)
      .catch((problem: Error) => setError(problem.message));
  }, []);

  function open(brief: Brief) {
    setOpened(brief);
    setPotential(undefined);
    setError('');
    api
      .potential(brief.id)
      .then(setPotential)
      .catch((problem: Error) => setError(problem.message));
    window.scrollTo(0, 0);
  }

  if (opened) {
    const details = opened.details ?? {};
    /* Les précisions données, avec les mots de l'écran du brief */
    const given = [
      ...NUMBERS.filter(([id]) => details[id] !== undefined).map(
        ([id, label, unit]) => [label, `${details[id]} ${unit}`],
      ),
      ...FIELDS.filter(({ id }) => details[id]?.toString()).map(
        ({ id, label }) => [
          label,
          [details[id]]
            .flat()
            .map((value) => labelOf(id, String(value)))
            .join(', '),
        ],
      ),
    ];
    return (
      <div className="mx-auto w-full max-w-4xl px-5 pb-10 pt-10 md:px-10">
        <p className={smallLabel}>
          Brief n° {opened.id} · {STATUS[opened.status]} ·{' '}
          {day(opened.createdAt)}
        </p>
        <h1 className="f-display mt-1 text-[40px] leading-[1.08] md:text-[48px]">
          Évaluation du potentiel
        </h1>
        <p className="mt-3 text-[17px]">{opened.wishes}</p>
        {opened.formulaName && (
          <p className="mt-1 text-[15px] text-secondary">
            Formule proposée : {opened.formulaName}
          </p>
        )}
        {opened.feedback && (
          <p className="mt-1 text-[15px]">
            <span className={smallLabel}>Retour après essai</span>{' '}
            {opened.feedback.map((item) => FEEDBACK[item] ?? item).join(', ')}
          </p>
        )}

        <section aria-label="Précisions du brief" className="mt-6">
          <h2 className="text-[20px] font-semibold">Précisions du brief</h2>
          {given.length === 0 ? (
            <p className="mt-1 text-[15px] text-secondary">
              La marque n’a rien précisé pour l’instant.
            </p>
          ) : (
            <dl className="mt-2 grid max-w-xl grid-cols-[190px_1fr] gap-y-1 border-t border-line-strong pt-3 text-[16px]">
              {given.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section aria-label="Critères" className="mt-8">
          <h2 className="text-[20px] font-semibold">Sept critères</h2>
          {!potential && !error && (
            <p className="mt-1 text-[15px] text-secondary">Calcul en cours…</p>
          )}
          {potential && (
            <>
              <ul className="mt-2 border-t border-line-strong">
                {potential.criteria.map((criterion) => (
                  <li
                    key={criterion.id}
                    className="grid gap-x-4 border-b border-line py-3 sm:grid-cols-[230px_120px_1fr]"
                  >
                    <span className="font-semibold">{criterion.label}</span>
                    <span
                      className={cn(
                        'text-sm',
                        criterion.status === 'favorable'
                          ? 'text-accent-text'
                          : 'text-secondary',
                      )}
                    >
                      {VERDICT[criterion.status]}
                    </span>
                    <span className="text-[15px]">{criterion.reason}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[20px] font-semibold">
                Suggestion : {potential.suggestionLabel}
              </p>
              <p className="text-[15px] text-secondary">
                {potential.favorable} critères favorables sur{' '}
                {potential.criteria.length}. {potential.note}
              </p>
            </>
          )}
        </section>
        {error && <p className={errorText}>{error}</p>}

        <button
          onClick={() => setOpened(undefined)}
          className={`${primaryButton} mt-8`}
        >
          Revenir au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-10 pt-10 md:px-10">
      <p className={smallLabel}>Karim B. · conseiller Givaudan</p>
      <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
        Tableau de bord
      </h1>
      <p className="mt-2 max-w-[60ch] text-sm text-secondary">
        Prototype : pas de connexion, cet espace est ouvert à tous. Les briefs
        arrivent ici dès que la marque a vu son plateau.
      </p>
      {error && <p className={errorText}>{error}</p>}
      {briefs?.length === 0 && (
        <p className="mt-6 text-[17px]">Aucun brief reçu pour l’instant.</p>
      )}

      <ul
        aria-label="Briefs reçus"
        className="mt-6 border-t border-line-strong"
      >
        {(briefs ?? []).map((brief) => (
          <li
            key={brief.id}
            className="grid items-center gap-x-4 border-b border-line py-3 sm:grid-cols-[1fr_auto_auto]"
          >
            <span>
              <span className="block text-[16px]">{brief.wishes}</span>
              <span className="text-sm text-secondary">
                {brief.universe === 'arome' ? 'Arôme' : 'Parfum'}
                {brief.formulaName && ` · ${brief.formulaName}`}
                {brief.feedback && ' · retour donné'}
              </span>
            </span>
            <span className="text-sm text-secondary">
              {STATUS[brief.status]} · {day(brief.createdAt)}
            </span>
            <button
              onClick={() => open(brief)}
              aria-label={`Ouvrir le brief n° ${brief.id}`}
              className={linkButton}
            >
              Ouvrir
            </button>
          </li>
        ))}
      </ul>

      <button onClick={onBack} className={`${primaryButton} mt-8`}>
        Revenir à l’atelier
      </button>
    </div>
  );
}
