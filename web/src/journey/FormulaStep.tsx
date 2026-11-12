/* Geste 3 : la marque reçoit une formule, puis demande son échantillon (geste 4) */
import { ArrowRight } from 'lucide-react';
import type { Formula } from '../api';
import {
  cn,
  errorText,
  linkButton,
  primaryButton,
  smallLabel,
} from '../shared/ui';

type Props = {
  formula: Formula;
  expert: string;
  /* Ce que veut dire chaque niveau, par exemple « Tête : ce que l'on sent en premier » */
  tiers: Record<string, string>;
  /* Le nom que la marque donne à sa création */
  name: string;
  onName: (name: string) => void;
  /* Les pays de vente donnés dans le brief, pour le contrôle réglementaire */
  countries: string[];
  /* La version que la marque garde : « A » ou « B » */
  version: string;
  onVersion: (version: string) => void;
  busy: boolean;
  error: string;
  onAccept: () => void;
  onBack: () => void;
};

export function FormulaStep({
  formula,
  expert,
  tiers,
  name,
  onName,
  countries,
  version,
  onVersion,
  busy,
  error,
  onAccept,
  onBack,
}: Props) {
  /* Les notes regroupées par niveau, dans l'ordre où la formule les donne */
  const levels = [...new Set(formula.notes.map(({ note }) => note.family))];
  /* L'IFRA ne concerne que les parfums */
  const flavour = expert === 'aromaticien';

  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>Notre proposition</p>
      <h1 className="f-display mt-1 text-[56px] leading-none md:text-[72px]">
        {formula.name}
      </h1>
      <p className={cn(smallLabel, 'mt-5')}>Pourquoi cette proposition</p>
      <p className="mt-1 max-w-[52ch] text-[17px] leading-snug">
        {formula.explanation}
      </p>

      <dl className="mt-6 border-t border-line-strong">
        {levels.map((level) => (
          <div
            key={level}
            className="grid gap-x-6 border-b border-line py-3 sm:grid-cols-[210px_1fr]"
          >
            <dt>
              <span className={smallLabel}>{level}</span>
              <span className="block text-sm opacity-80">{tiers[level]}</span>
            </dt>
            <dd className="font-semibold text-[23px] leading-tight first-letter:uppercase">
              {formula.notes
                .filter(({ note }) => note.family === level)
                .map(({ note }) => note.label)
                .join(', ')}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[13px] text-muted">
        Référence de notre banque ({formula.source}).
      </p>

      {formula.versions && formula.versions.length > 0 && (
        <section aria-label="Deux versions" className="mt-8">
          <h2 className="text-[20px] font-semibold">
            Deux versions. Gardez la vôtre.
          </h2>
          <p className="text-[15px] text-secondary">
            Les mêmes notes, un accent différent. Pas de dosage : les
            proportions sont fixées par votre {expert}.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {formula.versions.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onVersion(choice.id)}
                aria-pressed={version === choice.id}
                className={cn(
                  'rounded-xl border border-line-input bg-card px-4 py-3 text-left hover:bg-soft',
                  version === choice.id && 'bg-selected ring-2 ring-accent',
                )}
              >
                <span className="block text-[18px] font-semibold">
                  {choice.title}
                </span>
                <span className="block text-[15px] text-secondary">
                  {choice.why}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {formula.nearby && formula.nearby.length > 0 && (
        <section aria-label="Références proches" className="mt-8">
          <h2 className="text-[20px] font-semibold">
            {formula.nearby.length > 1
              ? `${formula.nearby.length} références proches dans la banque`
              : 'La référence proche dans la banque'}
          </h2>
          <ul className="mt-2 border-t border-line-strong">
            {formula.nearby.map((reference, index) => (
              <li
                key={reference.id}
                className="grid gap-x-4 border-b border-line py-2 sm:grid-cols-[200px_1fr]"
              >
                <span className="font-semibold">
                  {reference.name}
                  {index === 0 && (
                    <span className="ml-2 text-sm font-normal text-accent-text">
                      proposée
                    </span>
                  )}
                </span>
                <span className="text-secondary">
                  Famille {reference.family.toLowerCase()}. {reference.why}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <label className="mt-6 block max-w-md">
        <span className={smallLabel}>Le nom de votre création</span>
        <input
          aria-label="Le nom de votre création"
          value={name}
          onChange={(event) => onName(event.target.value)}
          maxLength={40}
          placeholder={formula.name}
          className="mt-1 min-h-12 w-full rounded-md border border-line-input bg-card rounded-md px-3 text-[16px] outline-none placeholder:text-muted focus:border-ink"
        />
      </label>

      <h2 className="mt-8 text-[20px] font-semibold">
        Avant votre échantillon
      </h2>
      <ul className="mt-2 border-t border-line-strong">
        {[
          [
            `Validée par un ${expert} Givaudan`,
            flavour ? 'Équilibre et dosages' : 'Équilibre, tenue et dosages',
          ],
          // « Dans votre produit » : une bougie ou une lessive ne se teste pas sur peau
          [
            'Testée dans votre produit',
            flavour
              ? 'Goût et stabilité dans le temps'
              : 'Tenue et stabilité dans le temps',
          ],
          [
            'Contrôlée pour vos pays de vente',
            `${flavour ? 'Réglementation alimentaire' : 'Normes IFRA et réglementation'} : ${countries.join(', ') || '[X]'}`,
          ],
        ].map(([check, detail]) => (
          <li key={check} className="border-b border-line py-2">
            <span className="block font-semibold">{check}</span>
            <span className="text-sm text-secondary">{detail}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-secondary">
        Ces trois étapes sont celles du vrai service : le prototype ne les
        réalise pas.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button onClick={onAccept} disabled={busy} className={primaryButton}>
          {busy
            ? 'Enregistrement…'
            : `Recevoir l’échantillon de ${name.trim() || formula.name}`}
          <ArrowRight className="size-4" />
        </button>
        <button onClick={onBack} className={linkButton}>
          Ajuster mes notes
        </button>
      </div>
      <p className="mt-4 text-sm opacity-85">
        Vous jugerez sur l’échantillon. Votre {expert} peut ensuite ajuster la
        formule avec vous.
      </p>
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
