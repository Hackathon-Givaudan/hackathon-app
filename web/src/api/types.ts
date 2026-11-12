/* Types du contrat d'API : voir openapi.yaml à la racine du dépôt */

export type Universe = 'parfum' | 'arome';

export type BriefStatus =
  | 'notes_proposed'
  | 'notes_validated'
  | 'formula_proposed'
  | 'formula_accepted';

export type Note = {
  id: string;
  label: string;
  family: string;
  reason?: string;
};

export type Brief = {
  id: number;
  universe: Universe;
  wishes: string;
  status: BriefStatus;
  proposedNotes: Note[];
  validatedNotes: Note[];
  /* Les précisions du brief : budget, cible, pays… toutes facultatives */
  details?: BriefDetails;
  /* Absents tant qu'il n'y a ni formule ni retour après essai */
  formulaName?: string;
  feedback?: string[];
  createdAt: string;
};

export type BriefDetails = Record<string, number | string | string[]>;

/* Le potentiel d'un brief pour le conseiller : sept critères et une suggestion */
export type Potential = {
  criteria: {
    id: string;
    label: string;
    status: 'favorable' | 'a_verifier' | 'a_completer';
    reason: string;
  }[];
  favorable: number;
  suggestion: string;
  suggestionLabel: string;
  note: string;
};

export type Formula = {
  id: string;
  name: string;
  notes: { note: Note; share: number }[];
  explanation: string;
  source: string;
};

/* Les quatre gestes du parcours */
/* Une idée retenue par Aurore, avec la phrase de la marque dont elle vient */
export type Idea = {
  kind: 'usage' | 'ambiance' | 'emotion' | 'sensation';
  label: string;
  quote: string;
};

export type Turn = { reply: string; heard: Idea[]; done: boolean };

/* La fiche matière d'une note : seulement ce que la Data a documenté */
export type Material = {
  noteId: string;
  name: string;
  family?: string;
  tier?: string;
  description?: string;
  material?: string;
  origin?: string;
  obtained?: string;
  hold?: string;
  pairsWith?: string[];
  vigilance?: string;
  sources?: string[];
};

export type Api = {
  sessionTurn(universe: Universe, said: string, heard: Idea[]): Promise<Turn>;
  createBrief(universe: Universe, wishes: string): Promise<Brief>;
  validateNotes(briefId: number, noteIds: string[]): Promise<Brief>;
  proposeFormula(briefId: number): Promise<Formula>;
  acceptFormula(briefId: number): Promise<Brief>;
  /* null quand la note n'a pas encore de fiche */
  material(noteId: string): Promise<Material | null>;
  completeBrief(briefId: number, details: BriefDetails): Promise<Brief>;
  listBriefs(): Promise<Brief[]>;
  potential(briefId: number): Promise<Potential>;
  giveFeedback(briefId: number, adjustments: string[]): Promise<Brief>;
};
