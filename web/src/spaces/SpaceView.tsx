/* L'espace client (écran 13 de la V3) : la marque retrouve son projet en cours, ses briefs,
   ses formules et les matières qu'elle a découvertes. Tout vient de la liste des briefs de l'API :
   le prototype n'a pas de comptes, la liste est donc la même pour tous. */
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Brief } from '../api';
import { ACCOUNT } from '../journey/WelcomeStep';
import { errorText, primaryButton, smallLabel } from '../shared/ui';

/* Où en est un brief, dit avec les mots de la marque */
export const STATUS: Record<Brief['status'], string> = {
  notes_proposed: 'Plateau proposé',
  notes_validated: 'Notes validées',
  formula_proposed: 'Formule proposée',
  formula_accepted: 'Échantillon demandé',
};

export const day = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

export function SpaceView({ onBack }: { onBack: () => void }) {
  const [briefs, setBriefs] = useState<Brief[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listBriefs()
      .then(setBriefs)
      .catch((problem: Error) => setError(problem.message));
  }, []);

  const current = briefs?.[0];
  const formulas = briefs?.filter((brief) => brief.formulaName) ?? [];
  /* Le carnet de senteurs : chaque matière gardée dans un plateau, une seule fois */
  const scents = [
    ...new Set(
      (briefs ?? []).flatMap((brief) =>
        brief.validatedNotes.map((note) => note.label),
      ),
    ),
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-10 pt-10 md:px-10">
      <p className={smallLabel}>
        {ACCOUNT.name} · {ACCOUNT.brand}
      </p>
      <h1 className="f-display mt-1 text-[44px] leading-[1.08] md:text-[52px]">
        Bonjour Léa.
      </h1>
      <p className="mt-2 text-sm text-secondary">
        Prototype : pas de comptes, cet espace montre tous les projets
        enregistrés.
      </p>
      {error && <p className={errorText}>{error}</p>}
      {briefs?.length === 0 && (
        <p className="mt-6 text-[17px]">
          Aucun projet pour l’instant. Commencez par une séance avec votre
          guide.
        </p>
      )}

      {current && (
        <section aria-label="Votre projet en cours" className="mt-8">
          <h2 className={smallLabel}>Votre projet en cours</h2>
          <p className="mt-1 text-[22px] font-semibold">
            {current.formulaName ?? 'Projet sans formule pour l’instant'}
          </p>
          <p className="text-[16px]">{current.wishes}</p>
          <p className="mt-1 text-sm text-secondary">
            {STATUS[current.status]} · {day(current.createdAt)}
          </p>
        </section>
      )}

      {briefs && briefs.length > 0 && (
        <>
          <section aria-label="Mes briefs" className="mt-8">
            <h2 className="text-[22px] font-semibold">Mes briefs</h2>
            <ul className="mt-2 border-t border-line-strong">
              {briefs.map((brief) => (
                <li
                  key={brief.id}
                  className="grid gap-x-4 border-b border-line py-3 sm:grid-cols-[1fr_auto]"
                >
                  <span className="text-[16px]">{brief.wishes}</span>
                  <span className="text-sm text-secondary">
                    {STATUS[brief.status]} · {day(brief.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Mes formules" className="mt-8">
            <h2 className="text-[22px] font-semibold">Mes formules</h2>
            {formulas.length === 0 ? (
              <p className="mt-1 text-[15px] text-secondary">
                Aucune formule pour l’instant.
              </p>
            ) : (
              <ul className="mt-2 border-t border-line-strong">
                {formulas.map((brief) => (
                  <li
                    key={brief.id}
                    className="grid gap-x-4 border-b border-line py-3 sm:grid-cols-[1fr_auto]"
                  >
                    <span className="text-[17px] font-semibold">
                      {brief.formulaName}
                    </span>
                    <span className="text-sm text-secondary">
                      {brief.feedback ? 'Retour donné' : STATUS[brief.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Carnet de senteurs" className="mt-8">
            <h2 className="text-[22px] font-semibold">Carnet de senteurs</h2>
            <p className="text-[15px] text-secondary">
              {scents.length} matières gardées dans vos plateaux.
            </p>
            <p className="mt-2 text-[16px] first-letter:uppercase">
              {scents.join(' · ')}
            </p>
          </section>
        </>
      )}

      <button onClick={onBack} className={`${primaryButton} mt-8`}>
        Revenir à l’atelier
      </button>
    </div>
  );
}
