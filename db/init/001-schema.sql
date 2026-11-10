-- Un brief porte tout le parcours d'une marque : voir openapi.yaml
CREATE TABLE briefs (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  universe TEXT NOT NULL CHECK (universe IN ('parfum', 'arome')),
  wishes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'notes_proposed' CHECK (
    status IN ('notes_proposed', 'notes_validated', 'formula_proposed', 'formula_accepted')
  ),
  proposed_notes JSONB NOT NULL,
  validated_notes JSONB NOT NULL DEFAULT '[]',
  formula JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
