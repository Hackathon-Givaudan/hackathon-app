/* Geste 1 : trois questions à choix, puis une précision libre et facultative.
   Les réponses forment les envies envoyées à l'API. */
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Universe } from '../api';
import {
  cn,
  errorText,
  linkButton,
  primaryButton,
  smallLabel,
} from '../shared/ui';
import { VOCABULARY } from '../shared/vocabulary';

type Props = {
  universe: Universe;
  busy: boolean;
  error: string;
  onSubmit: (wishes: string) => void;
  onBack: () => void;
};

export function DescribeStep({
  universe,
  busy,
  error,
  onSubmit,
  onBack,
}: Props) {
  const { questions } = VOCABULARY[universe];
  const [answers, setAnswers] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [detail, setDetail] = useState('');
  const done = answers.filter(Boolean).length === questions.length;

  function answer(option: string) {
    const next = [...answers];
    next[current] = option;
    setAnswers(next);
    setCurrent(Math.min(current + 1, questions.length));
  }

  function submit() {
    const [product, mood, emotion] = answers;
    onSubmit(
      `Produit : ${product}. Ambiance : ${mood}. Émotion : ${emotion}. ${detail.trim()}`.trim(),
    );
  }

  return (
    <div className="mt-auto pb-6 pt-10">
      {/* Réponses déjà données : un clic rouvre la question */}
      <div className="flex min-h-11 flex-wrap gap-2">
        {questions.map((question, index) =>
          answers[index] ? (
            <button
              key={question.id}
              onClick={() => setCurrent(index)}
              className="h-11 border border-white/45 px-3 text-sm first-letter:uppercase hover:bg-white/10"
            >
              {answers[index]}
            </button>
          ) : null,
        )}
      </div>

      {current < questions.length ? (
        <>
          <p className={cn(smallLabel, 'mt-6')}>
            Question {current + 1} sur {questions.length}
          </p>
          <h1
            key={current}
            className="f-display mt-1 text-[44px] leading-[1.08] md:text-[56px]"
          >
            {questions[current].title}
          </h1>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {questions[current].options.map((option) => (
              <button
                key={option}
                onClick={() => answer(option)}
                aria-pressed={answers[current] === option}
                className={cn(
                  'min-h-16 border border-white/45 px-3 text-[16px] first-letter:uppercase',
                  answers[current] === option
                    ? 'bg-[#F2ECF0] text-[#22101F]'
                    : 'hover:bg-white/10',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="f-display mt-6 text-[44px] leading-[1.08] md:text-[56px]">
            <label htmlFor="detail">Une précision à ajouter&nbsp;?</label>
          </h1>
          <p className="mt-2 text-[15px]">
            Facultatif. Avec vos mots : un souvenir, une matière, ce qu’il faut
            éviter.
          </p>
          <textarea
            id="detail"
            rows={2}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="Par exemple : rien de trop sucré"
            className="mt-4 w-full resize-none border border-white/50 bg-white/10 p-3 text-[16px] outline-none placeholder:text-white/65 focus:border-white"
          />
          <button
            onClick={submit}
            disabled={busy || !done}
            className={cn(primaryButton, 'mt-5')}
          >
            {busy ? 'Traduction en notes…' : 'Traduire en notes'}
            <ArrowRight className="size-4" />
          </button>
        </>
      )}

      <div className="mt-5">
        <button onClick={onBack} className={linkButton}>
          Changer d’univers
        </button>
      </div>
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
