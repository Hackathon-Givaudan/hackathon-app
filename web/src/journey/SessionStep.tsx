/* Geste 1 : la séance. La marque échange par écrit avec Aurore, qui note ce qu'elle entend.
   Le brief est fait de ce qu'Aurore a entendu et que la marque a laissé : rien d'autre. */
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { api } from '../api';
import type { Idea, Universe } from '../api';
import {
  cn,
  errorText,
  linkButton,
  primaryButton,
  smallLabel,
} from '../shared/ui';
import { VOCABULARY } from '../shared/vocabulary';
import { Analysing } from './Analysing';

type Props = {
  universe: Universe;
  /* Le prénom du guide choisi à la bienvenue */
  guide: string;
  /* Le produit choisi à la bienvenue (« une bougie »), ou rien */
  product: string;
  busy: boolean;
  error: string;
  onSubmit: (wishes: string) => void;
  onBack: () => void;
};

type Line = { who: 'aurore' | 'brand'; text: string };

/* La question du vocabulaire qui correspond à chaque sorte d'idée, pour proposer des réponses rapides */
const ASKS: [Idea['kind'], string][] = [
  ['usage', 'product'],
  ['ambiance', 'mood'],
  ['emotion', 'emotion'],
];

/* Le mot affiché pour chaque sorte d'idée, et repris dans le brief : « Produit : bougie. » */
const KINDS: Record<Idea['kind'], string> = {
  usage: 'Produit',
  ambiance: 'Ambiance',
  emotion: 'Émotion',
  sensation: 'Sensation',
};

export function SessionStep({
  universe,
  guide,
  product,
  busy,
  error,
  onSubmit,
  onBack,
}: Props) {
  const { examples, questions } = VOCABULARY[universe];
  const [lines, setLines] = useState<Line[]>([]);
  const [heard, setHeard] = useState<Idea[]>([]);
  const [text, setText] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [failure, setFailure] = useState('');
  const opened = useRef(false);

  /* Envoie ce que dit la marque (rien, pour ouvrir la séance) et ajoute la réponse d'Aurore */
  async function say(said: string) {
    setWaiting(true);
    setFailure('');
    if (said) setLines((all) => [...all, { who: 'brand', text: said }]);
    try {
      const turn = await api.sessionTurn(universe, said, heard);
      setHeard(turn.heard);
      setLines((all) => [...all, { who: 'aurore', text: turn.reply }]);
    } catch (problem) {
      setFailure(problem instanceof Error ? problem.message : String(problem));
    } finally {
      setWaiting(false);
    }
  }

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    void say(product ? `Mon produit : ${product}.` : '');
  }, []); // la séance s'ouvre une seule fois, à l'arrivée sur l'écran

  function send() {
    const said = text.trim();
    if (!said || waiting) return;
    setText('');
    void say(said);
  }

  /* Le brief : les idées entendues, rangées par sorte. « Produit : bougie. Ambiance : bord de mer. » */
  const wishes = (Object.keys(KINDS) as Idea['kind'][])
    .map((kind) => [kind, heard.filter((idea) => idea.kind === kind)] as const)
    .filter(([, ideas]) => ideas.length > 0)
    .map(
      ([kind, ideas]) =>
        `${KINDS[kind]} : ${ideas.map((idea) => idea.label).join(', ')}.`,
    )
    .join(' ');

  if (busy) {
    return (
      <div className="mt-auto pb-6 pt-10">
        <Analysing />
      </div>
    );
  }

  const started = lines.some((line) => line.who === 'brand');
  /* Réponses rapides : des mots du référentiel pour la première sorte d'idée qui manque encore */
  const missing = ASKS.find(
    ([kind]) => !heard.some((idea) => idea.kind === kind),
  );
  const quick =
    questions.find((question) => question.id === missing?.[1])?.options ?? [];

  return (
    <div className="mt-auto pb-6 pt-10">
      <p className={smallLabel}>
        La séance · avec {guide}
        {lines.length > 0 && ` · message ${lines.length} · environ 4 min`}
      </p>
      <h1 className="f-display mt-1 text-[40px] leading-[1.08] md:text-[48px]">
        Parlez-nous de votre projet.
      </h1>

      <ol className="mt-5 space-y-3" aria-live="polite">
        {lines.map((line, index) => (
          <li
            key={index}
            data-who={line.who}
            className={cn(
              'max-w-[46ch] text-[17px] leading-snug',
              line.who === 'brand' &&
                'ml-auto border border-line-input px-3 py-2',
            )}
          >
            {line.who === 'aurore' ? `« ${line.text} »` : line.text}
          </li>
        ))}
        {waiting && <li className="text-[15px] opacity-70">{guide} écoute…</li>}
      </ol>

      <div className="mt-4 flex gap-2">
        <input
          aria-label="Votre réponse"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && send()}
          placeholder="Écrivez votre réponse…"
          className="min-h-12 flex-1 border border-line-input bg-card rounded-md px-3 text-[16px] outline-none placeholder:text-muted focus:border-ink"
        />
        <button
          onClick={send}
          disabled={waiting || !text.trim()}
          className={primaryButton}
        >
          Envoyer
        </button>
      </div>

      {started && !waiting && quick.length > 0 && (
        <div role="group" aria-label="Réponses rapides" className="mt-4">
          <p className={smallLabel}>Réponses rapides</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {quick.slice(0, 4).map((option) => (
              <button
                key={option}
                onClick={() => void say(option)}
                className="min-h-11 rounded-full border border-line-strong px-4 text-[15px] first-letter:uppercase hover:bg-soft"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {!started && (
        <>
          <p className={cn(smallLabel, 'mt-4')}>Besoin d’inspiration ?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => void say(example)}
                disabled={waiting}
                className="min-h-11 border border-line-strong rounded-full px-3 text-left text-[15px] hover:bg-soft"
              >
                {example}
              </button>
            ))}
          </div>
        </>
      )}

      <section aria-label="Ce que je retiens" className="mt-6">
        <h2 className={smallLabel}>Ce que je retiens</h2>
        {heard.length === 0 ? (
          <p className="mt-1 text-[15px] opacity-80">
            Tout vient de notre conversation. Une info à corriger ? Retirez-la.
          </p>
        ) : (
          <ul className="mt-2 border-t border-line-strong">
            {heard.map((idea) => (
              <li
                key={idea.label}
                className="flex items-start gap-3 border-b border-line py-2"
              >
                <span className="flex-1">
                  <span className={smallLabel}>{KINDS[idea.kind]}</span>{' '}
                  <span className="text-[17px] first-letter:uppercase">
                    {idea.label}
                  </span>
                  <span className="block text-sm opacity-75">
                    « {idea.quote} »
                  </span>
                </span>
                <button
                  onClick={() =>
                    setHeard(heard.filter((kept) => kept.label !== idea.label))
                  }
                  aria-label={`Retirer ${idea.label}`}
                  className="grid size-9 place-items-center hover:bg-soft"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          onClick={() => onSubmit(wishes)}
          disabled={heard.length === 0 || waiting}
          className={primaryButton}
        >
          Voir mon brief
          <ArrowRight className="size-4" />
        </button>
        <button onClick={onBack} className={linkButton}>
          Changer d’univers
        </button>
      </div>
      {(failure || error) && <p className={errorText}>{failure || error}</p>}
    </div>
  );
}
