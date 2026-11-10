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
  createdAt: string;
};

export type Formula = {
  id: string;
  name: string;
  notes: { note: Note; share: number }[];
  explanation: string;
  source: string;
};

/* Les quatre gestes du parcours */
export type Api = {
  createBrief(universe: Universe, wishes: string): Promise<Brief>;
  validateNotes(briefId: number, noteIds: string[]): Promise<Brief>;
  proposeFormula(briefId: number): Promise<Formula>;
  acceptFormula(briefId: number): Promise<Brief>;
};
