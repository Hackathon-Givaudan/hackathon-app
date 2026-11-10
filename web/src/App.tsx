/* Socle du front : la page vérifie que la couche API répond.
   Les écrans du parcours la remplaceront. */
import { useState } from 'react';
import { api, isDemo } from './api';
import type { Brief, Universe } from './api';
import { errorText, primaryButton, smallLabel } from './shared/ui';
import { VOCABULARY } from './shared/vocabulary';

export default function App() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /* Envoie l'exemple d'un univers : c'est le geste 1 du contrat */
  async function tryUniverse(universe: Universe) {
    setBusy(true);
    setError('');
    try {
      setBrief(
        await api.createBrief(universe, VOCABULARY[universe].examples[0]),
      );
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Une erreur est survenue, réessayez.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="f-root ink min-h-svh px-5 py-8 md:px-10">
      <p className="f-display text-[30px] leading-none">Sillage</p>
      <p className="mono mt-1.5 text-[10px]">
        Concept étudiant pour Givaudan{isDemo && ' · démonstration'}
      </p>

      <h1 className="f-display mt-16 max-w-[20ch] text-[44px] leading-[1.08]">
        Le parcours arrive ici.
      </h1>
      <p className="mt-2 text-[15px]">
        En attendant, testez le premier geste : envoyer des envies et recevoir
        des notes.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {(Object.keys(VOCABULARY) as Universe[]).map((universe) => (
          <button
            key={universe}
            onClick={() => tryUniverse(universe)}
            disabled={busy}
            className={primaryButton}
          >
            Essayer : {VOCABULARY[universe].label}
          </button>
        ))}
      </div>
      {error && <p className={errorText}>{error}</p>}

      {brief && (
        <section className="mt-8 max-w-xl">
          <p className={smallLabel}>Envies envoyées</p>
          <p className="mt-1 text-[15px]">« {brief.wishes} »</p>
          <ul className="mt-4 border-t border-white/45">
            {brief.proposedNotes.map((note) => (
              <li key={note.id} className="border-b border-white/25 py-2">
                <span className="f-display text-[21px] first-letter:uppercase">
                  {note.label}
                </span>
                <span className="ml-3 text-sm opacity-80">{note.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
