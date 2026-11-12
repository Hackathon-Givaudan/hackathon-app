/* L'aide : la marque pose une question, Aurore répond avec une réponse validée, ou dit qu'elle ne peut pas */
import { useState } from 'react';
import { Dialog } from '../shared/Dialog';
import { answerTo, FAQ } from '../shared/faq';
import { linkButton, primaryButton, smallLabel } from '../shared/ui';

export function HelpDialog({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');

  function ask(text: string) {
    setQuestion(text);
    setAsked(text);
  }

  return (
    <Dialog title="Aide" onClose={onClose}>
      <p className="mt-2 text-[15px] opacity-85">
        Posez votre question à Aurore. Elle ne répond que sur votre projet.
      </p>
      <div className="mt-4 flex gap-2">
        <input
          aria-label="Votre question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && ask(question)}
          className="min-h-12 flex-1 border border-white/50 bg-white/10 px-3 text-[16px] outline-none focus:border-white"
        />
        <button onClick={() => ask(question)} className={primaryButton}>
          Demander
        </button>
      </div>
      {asked && (
        <p className="mt-4 text-[17px] leading-snug" aria-live="polite">
          « {answerTo(asked)} »
        </p>
      )}
      <p className={`${smallLabel} mt-6`}>Questions fréquentes</p>
      <ul className="mt-1">
        {FAQ.map((entry) => (
          <li key={entry.question}>
            <button onClick={() => ask(entry.question)} className={linkButton}>
              {entry.question}
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
