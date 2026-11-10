/* Geste 1 : la marque décrit son projet avec ses mots.
   Elle peut partir d'un exemple, ou se laisser guider par trois questions. */
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
import { Analysing } from './Analysing';

type Props = {
  universe: Universe;
  busy: boolean;
  error: string;
  onSubmit: (wishes: string) => void;
  onBack: () => void;
};

const chip =
  'min-h-11 border border-white/45 px-3 text-left text-[15px] hover:bg-white/10';

export function DescribeStep({
  universe,
  busy,
  error,
  onSubmit,
  onBack,
}: Props) {
  const { questions, examples } = VOCABULARY[universe];
  const [text, setText] = useState('');
  const [guided, setGuided] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  /* Les réponses guidées d'abord, puis le texte libre : « Produit : bougie. … » */
  const wishes = [
    ...questions
      .filter(({ id }) => answers[id])
      .map(({ id, label }) => `${label} : ${answers[id]}.`),
    text.trim(),
  ]
    .join(' ')
    .trim();

  if (busy) {
    return (
      <div className="mt-auto pb-6 pt-10">
        <Analysing />
      </div>
    );
  }

  return (
    <div className="mt-auto pb-6 pt-10">
      <h1 className="f-display text-[44px] leading-[1.08] md:text-[56px]">
        <label htmlFor="project">Parlez-nous de votre projet.</label>
      </h1>
      <p className="mt-2 text-[15px]">
        Décrivez-le avec vos mots : vous n’avez pas besoin de connaître les
        notes ni les dosages.
      </p>
      <textarea
        id="project"
        aria-label="Votre projet"
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={`Par exemple : ${examples[0].toLowerCase()}`}
        className="mt-4 w-full resize-none border border-white/50 bg-white/10 p-3 text-[16px] outline-none placeholder:text-white/65 focus:border-white"
      />

      <p className={cn(smallLabel, 'mt-5')}>Besoin d’inspiration ?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => setText(example)}
            className={chip}
          >
            {example}
          </button>
        ))}
        <button
          onClick={() => setGuided(!guided)}
          aria-expanded={guided}
          className={cn(chip, guided && 'bg-white/15')}
        >
          Me laisser guider
        </button>
      </div>

      {guided &&
        questions.map(({ id, title, options }) => (
          <fieldset key={id} className="mt-4">
            <legend className="text-[15px]">{title}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setAnswers({
                      ...answers,
                      [id]: answers[id] === option ? '' : option,
                    })
                  }
                  aria-pressed={answers[id] === option}
                  className={cn(
                    'min-h-11 border border-white/45 px-3 text-[15px] first-letter:uppercase',
                    answers[id] === option
                      ? 'bg-[#F2ECF0] text-[#22101F]'
                      : 'hover:bg-white/10',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
        ))}

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          onClick={() => onSubmit(wishes)}
          disabled={wishes.length < 3}
          className={primaryButton}
        >
          Continuer
          <ArrowRight className="size-4" />
        </button>
        <button onClick={onBack} className={linkButton}>
          Changer d’univers
        </button>
      </div>
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
