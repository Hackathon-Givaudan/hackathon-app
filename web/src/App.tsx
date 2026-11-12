/* Le parcours d'une marque en quatre gestes :
   décrire ses envies, valider les notes, recevoir une formule, l'accepter. */
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import gsap from 'gsap';
import { api } from './api';
import { BottleBoundary } from './bottle/BottleBoundary';
import type { Brief, Formula, Universe } from './api';
import { noteColor } from './bottle/colors';
import { AcceptedStep } from './journey/AcceptedStep';
import { SessionStep } from './journey/SessionStep';
import { FormulaStep } from './journey/FormulaStep';
import { HelpDialog } from './journey/HelpDialog';
import { ProfileStep } from './journey/ProfileStep';
import { TrayStep, type Opinion } from './journey/TrayStep';
import { UniverseStep } from './journey/UniverseStep';
import type { Layer } from './bottle/Bottle3D';
import type { Vial } from './bottle/Tray3D';
import { VOCABULARY } from './shared/vocabulary';
import { cn } from './shared/ui';

const Bottle3D = lazy(() => import('./bottle/Bottle3D'));
const Tray3D = lazy(() => import('./bottle/Tray3D'));

type Step =
  'universe' | 'describe' | 'profile' | 'notes' | 'formula' | 'accepted';
const STEPS: [Step, string][] = [
  ['universe', 'Univers'],
  ['describe', 'Séance'],
  ['profile', 'Brief'],
  ['notes', 'Plateau'],
  ['formula', 'Formule'],
  ['accepted', 'Demande'],
];

export default function App() {
  const [step, setStep] = useState<Step>('universe');
  const [universe, setUniverse] = useState<Universe>('parfum');
  const [brief, setBrief] = useState<Brief | null>(null);
  /* Ce qu'Aurore a entendu pendant la séance, avant le profil */
  const [heardWishes, setHeardWishes] = useState('');
  /* L'avis de la marque sur chaque fiole de son plateau */
  const [opinions, setOpinions] = useState<Record<string, Opinion>>({});
  const keptIds = Object.keys(opinions).filter((id) => opinions[id] !== 'no');
  const [formula, setFormula] = useState<Formula | null>(null);
  /* Le nom que la marque donne à sa création */
  const [creationName, setCreationName] = useState('');
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef<HTMLElement>(null);
  const { expert, object, lid, noteHelp, tiers } = VOCABULARY[universe];
  /* Tant que la marque n'a pas dit ce qu'elle crée, on ne montre ni flacon ni pot */
  const chosen = step !== 'universe';

  /* Lance un geste : état d'attente, puis résultat ou message d'erreur */
  async function run(gesture: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await gesture();
      window.scrollTo(0, 0);
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

  const sendWishes = (wishes: string) =>
    run(async () => {
      const created = await api.createBrief(universe, wishes);
      setBrief(created);
      setOpinions({});
      setStep('notes');
    });

  const validateNotes = () =>
    run(async () => {
      const updated = await api.validateNotes(brief!.id, keptIds);
      setBrief(updated);
      setFormula(await api.proposeFormula(updated.id));
      setStep('formula');
    });

  const acceptFormula = () =>
    run(async () => {
      setBrief(await api.acceptFormula(brief!.id));
      setStep('accepted');
    });

  function restart() {
    setBrief(null);
    setFormula(null);
    setOpinions({});
    setHeardWishes('');
    setCreationName('');
    setError('');
    setStep('universe');
  }

  /* Le flacon montre ce que la marque a construit jusqu'ici */
  const kept =
    brief?.proposedNotes.filter((note) => keptIds.includes(note.id)) ?? [];
  const layers: Layer[] =
    step === 'universe' || step === 'describe' || step === 'profile'
      ? []
      : step === 'notes'
        ? kept.slice(0, 5).map((note) => ({
            n: note.label,
            p: Math.round(100 / Math.min(kept.length, 5)),
            c: noteColor(note.label),
          }))
        : [...(formula?.notes ?? [])]
            .sort((a, b) => b.share - a.share)
            .slice(0, 5)
            .map(({ note, share }) => ({
              n: note.label,
              p: share,
              c: noteColor(note.label),
            }));
  /* Le plateau en 3D : la fiole en cours se soulève, les écartées s'estompent */
  const firstUnsmelled = brief?.proposedNotes.find(
    (note) => !opinions[note.id],
  );
  const vials: Vial[] = (brief?.proposedNotes ?? []).map((note) => ({
    label: note.label,
    color: noteColor(note.label),
    state:
      note === firstUnsmelled
        ? 'current'
        : !opinions[note.id]
          ? 'waiting'
          : opinions[note.id] === 'no'
            ? 'left'
            : 'kept',
  }));
  const waiting =
    step === 'universe' || step === 'describe' || step === 'profile';
  const bottleTitle = waiting
    ? 'Brief'
    : step === 'notes'
      ? 'Notes'
      : 'Formule';
  const bottleCaption = waiting
    ? 'à écrire'
    : step === 'notes'
      ? `${kept.length} retenues`
      : (formula?.name ?? '');

  useEffect(() => {
    document.title = 'Sillage, concept étudiant pour Givaudan';
  }, []);

  /* Entrée douce du titre à chaque écran */
  useLayoutEffect(() => {
    const title = panel.current?.querySelector('h1');
    if (!title || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    const tween = gsap.fromTo(
      title,
      { y: 24, clipPath: 'inset(0 0 100% 0)' },
      {
        y: 0,
        clipPath: 'inset(0 0 -20% 0)',
        duration: 0.9,
        ease: 'expo.out',
        /* Le masque ne sert qu'à l'entrée : laissé en place, il coupe la deuxième ligne d'un titre long */
        clearProps: 'clipPath,transform',
      },
    );
    return () => {
      tween.progress(1).kill();
    };
  }, [step]);

  const stepIndex = STEPS.findIndex(([id]) => id === step);

  return (
    <div className="f-root ink relative isolate flex min-h-svh flex-col overflow-x-clip">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-2 px-5 pt-5 md:px-10">
        <div className="pb-4">
          <p className="f-display text-[30px] leading-none">Sillage</p>
          <p className="mono mt-1.5 text-[10px]">
            Concept étudiant pour Givaudan
          </p>
        </div>
        <button
          onClick={() => setHelp(true)}
          className="order-last h-14 px-3 text-sm underline underline-offset-4"
        >
          Aide
        </button>
        {help && <HelpDialog onClose={() => setHelp(false)} />}
        <ol aria-label="Étapes" className="flex">
          {STEPS.map(([id, label], index) => (
            <li
              key={id}
              aria-current={index === stepIndex ? 'step' : undefined}
              className={cn(
                'flex h-14 items-center border-b-2 px-3 text-sm md:px-5',
                index === stepIndex ? 'border-[#ECE9EF]' : 'border-transparent',
                index > stepIndex && 'text-[#C4B7C2]',
              )}
            >
              <span className="mono mr-2 text-[11px]">{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </header>

      <div className={cn('grid flex-1', chosen && 'lg:grid-cols-2')}>
        {chosen && (
          <aside className="flex flex-col px-5 pb-6 md:px-10 lg:sticky lg:top-0 lg:h-[calc(100svh-74px)]">
            <div className="relative min-h-[340px] flex-1 bg-[radial-gradient(ellipse_46%_52%_at_50%_46%,rgb(255_236_220/.13),transparent_72%)]">
              <BottleBoundary>
                <Suspense fallback={null}>
                  {step === 'notes' && brief ? (
                    <Tray3D vials={vials} />
                  ) : (
                    <Bottle3D
                      layers={layers}
                      title={bottleTitle}
                      sub={bottleCaption}
                      spinKey={step}
                      focus={null}
                      lid={lid}
                    />
                  )}
                </Suspense>
              </BottleBoundary>
            </div>
            <p className="mono text-[11px] opacity-80">
              {layers.length === 0
                ? `Le ${object} se remplit avec vos mots.`
                : layers.map((layer) => layer.n).join(' · ')}
            </p>
          </aside>
        )}

        <main
          ref={panel}
          className="flex min-w-0 flex-col bg-[#1B0C19]/45 px-5 md:px-10"
        >
          <div
            className={cn(
              'flex flex-1 flex-col',
              chosen ? 'max-w-2xl' : 'mx-auto w-full max-w-5xl',
            )}
          >
            {step === 'universe' && (
              <UniverseStep
                onChoose={(chosen) => {
                  setUniverse(chosen);
                  setStep('describe');
                }}
              />
            )}
            {step === 'describe' && (
              <SessionStep
                key={universe}
                universe={universe}
                busy={busy}
                error={error}
                onSubmit={(wishes) => {
                  setHeardWishes(wishes);
                  setStep('profile');
                }}
                onBack={() => setStep('universe')}
              />
            )}
            {step === 'profile' && (
              <ProfileStep
                universe={universe}
                wishes={heardWishes}
                busy={busy}
                error={error}
                onSubmit={sendWishes}
                onBack={() => setStep('describe')}
              />
            )}
            {step === 'notes' && brief && (
              <TrayStep
                notes={brief.proposedNotes}
                opinions={opinions}
                onOpinion={(id, opinion) =>
                  setOpinions((all) => ({ ...all, [id]: opinion }))
                }
                noteHelp={noteHelp}
                busy={busy}
                error={error}
                onValidate={validateNotes}
                onBack={() => setStep('profile')}
              />
            )}
            {step === 'formula' && formula && (
              <FormulaStep
                formula={formula}
                expert={expert}
                tiers={tiers}
                name={creationName}
                onName={setCreationName}
                busy={busy}
                error={error}
                onAccept={acceptFormula}
                onBack={() => setStep('notes')}
              />
            )}
            {step === 'accepted' && formula && (
              <AcceptedStep
                formula={formula}
                name={creationName.trim() || formula.name}
                expert={expert}
                onRestart={restart}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
