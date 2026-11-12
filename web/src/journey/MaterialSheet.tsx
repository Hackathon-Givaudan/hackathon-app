/* La fiche matière de la fiole que la marque sent : origine, obtention, tenue, accords.
   On n'affiche que ce que la Data a documenté ; sans fiche, on le dit. */
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Material, Note } from '../api';
import { smallLabel } from '../shared/ui';

type State = { noteId: string; sheet: Material | null } | null;

export function MaterialSheet({ note }: { note: Note }) {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    let current = true;
    api
      .material(note.id)
      .catch(() => null)
      .then((sheet) => current && setState({ noteId: note.id, sheet }));
    return () => {
      current = false;
    };
  }, [note.id]);

  /* Une réponse arrivée pour une autre fiole ne compte pas */
  const sheet = state?.noteId === note.id ? state.sheet : undefined;
  const rows: [string, string | undefined][] = [
    ['Famille', sheet?.family ?? note.family],
    ['Origine', sheet?.origin],
    ['Obtention', sheet?.obtained],
    ['Tenue', sheet?.hold],
    ['Va bien avec', sheet?.pairsWith?.join(', ')],
    ['Vigilance', sheet?.vigilance],
  ];

  return (
    <section
      aria-label="Fiche matière"
      className="mt-4 max-w-md border-t border-line-strong pt-3"
    >
      {sheet?.description && (
        <p className="mb-3 text-[16px]">{sheet.description}</p>
      )}
      <dl className="grid grid-cols-[110px_1fr] gap-y-1 text-[15px]">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className={smallLabel}>{label}</dt>
              <dd className="first-letter:uppercase">{value}</dd>
            </div>
          ))}
      </dl>
      {sheet === null && (
        <p className="mt-2 text-sm text-secondary">
          Fiche à venir : l’équipe Data ne l’a pas encore documentée.
        </p>
      )}
    </section>
  );
}
