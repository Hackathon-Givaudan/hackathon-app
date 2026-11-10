import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from 'express';
import pg from 'pg';
import {
  IaError,
  isRecord,
  proposeFormula,
  proposeNotes,
  type Formula,
  type Note,
  type Universe,
} from './ia.js';

try {
  process.loadEnvFile();
} catch {
  // Pas de .env : la configuration vient de l'hébergeur
}

const PORT = Number(process.env.PORT ?? 3000);
const MAX_ID = 2_147_483_647;

type BriefStatus =
  | 'notes_proposed'
  | 'notes_validated'
  | 'formula_proposed'
  | 'formula_accepted';

type BriefRow = {
  id: number;
  universe: Universe;
  wishes: string;
  status: BriefStatus;
  proposed_notes: Note[];
  validated_notes: Note[];
  formula: Formula | null;
  created_at: Date;
};

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.use(express.json());

/* Le schéma Brief de openapi.yaml : la formule a sa propre route */
function toBrief(row: BriefRow) {
  return {
    id: row.id,
    universe: row.universe,
    wishes: row.wishes,
    status: row.status,
    proposedNotes: row.proposed_notes,
    validatedNotes: row.validated_notes,
    createdAt: row.created_at.toISOString(),
  };
}

function fail(res: Response, status: number, error: string) {
  res.status(status).json({ error });
}

/* Renvoie le brief, ou répond 404 et renvoie undefined */
async function findBrief(req: Request, res: Response) {
  const id = Number(req.params.briefId);
  const { rows } =
    Number.isInteger(id) && id >= 1 && id <= MAX_ID
      ? await db.query<BriefRow>('SELECT * FROM briefs WHERE id = $1', [id])
      : { rows: [] };
  if (!rows[0]) fail(res, 404, 'Brief introuvable');
  return rows[0];
}

app.get('/api/health', async (_req, res) => {
  const { rows } = await db.query('SELECT version()');
  res.json({ status: 'ok', db: rows[0].version });
});

/* Geste 1 : envoyer ses envies */
app.post('/api/briefs', async (req, res) => {
  const body: unknown = req.body;
  const universe = isRecord(body) ? body.universe : undefined;
  const wishes =
    isRecord(body) && typeof body.wishes === 'string' ? body.wishes.trim() : '';
  if (universe !== 'parfum' && universe !== 'arome') {
    return fail(res, 400, 'Univers inconnu : parfum ou arome');
  }
  if (wishes.length < 3) return fail(res, 400, 'Envies manquantes');
  if (wishes.length > 2000) {
    return fail(res, 400, 'Envies trop longues : 2000 caractères au plus');
  }

  const notes = await proposeNotes(universe, wishes);
  const { rows } = await db.query<BriefRow>(
    `INSERT INTO briefs (universe, wishes, proposed_notes)
     VALUES ($1, $2, $3::jsonb) RETURNING *`,
    [universe, wishes, JSON.stringify(notes)],
  );
  res.status(201).json(toBrief(rows[0]));
});

app.get('/api/briefs/:briefId', async (req, res) => {
  const brief = await findBrief(req, res);
  if (brief) res.json(toBrief(brief));
});

/* Geste 2 : valider les notes */
app.put('/api/briefs/:briefId/notes', async (req, res) => {
  const body: unknown = req.body;
  const noteIds: unknown[] =
    isRecord(body) && Array.isArray(body.noteIds) ? body.noteIds : [];
  if (noteIds.length === 0 || !noteIds.every((id) => typeof id === 'string')) {
    return fail(res, 400, 'Gardez au moins une note');
  }

  const brief = await findBrief(req, res);
  if (!brief) return;
  if (brief.status === 'formula_accepted') {
    return fail(res, 409, 'La formule est acceptée : ce brief est terminé');
  }
  const unknown = noteIds.find(
    (id) => !brief.proposed_notes.some((note) => note.id === id),
  );
  if (unknown !== undefined) {
    return fail(res, 400, `Note inconnue : ${unknown}`);
  }

  // Changer les notes rend caduque une formule déjà proposée
  const validated = brief.proposed_notes.filter((note) =>
    noteIds.includes(note.id),
  );
  const { rows } = await db.query<BriefRow>(
    `UPDATE briefs
     SET validated_notes = $1::jsonb, status = 'notes_validated', formula = NULL
     WHERE id = $2 RETURNING *`,
    [JSON.stringify(validated), brief.id],
  );
  res.json(toBrief(rows[0]));
});

/* Geste 3 : recevoir une formule */
app.post('/api/briefs/:briefId/formula', async (req, res) => {
  const brief = await findBrief(req, res);
  if (!brief) return;
  // Rappeler la route renvoie la même formule, sans rappeler le service
  if (brief.formula) return void res.json(brief.formula);
  if (brief.status === 'notes_proposed') {
    return fail(res, 409, 'Validez les notes avant de demander une formule');
  }

  // Les notes proposées puis retirées : la formule doit dire si elle en contient une
  const keptIds = brief.validated_notes.map((note) => note.id);
  const formula = await proposeFormula(
    brief.universe,
    brief.wishes,
    keptIds,
    brief.proposed_notes
      .map((note) => note.id)
      .filter((id) => !keptIds.includes(id)),
  );
  await db.query(
    `UPDATE briefs SET formula = $1::jsonb, status = 'formula_proposed'
     WHERE id = $2`,
    [JSON.stringify(formula), brief.id],
  );
  res.json(formula);
});

/* Geste 4 : accepter la formule */
app.post('/api/briefs/:briefId/formula/acceptance', async (req, res) => {
  const brief = await findBrief(req, res);
  if (!brief) return;
  if (!brief.formula) return fail(res, 409, 'Aucune formule à accepter');

  const { rows } = await db.query<BriefRow>(
    `UPDATE briefs SET status = 'formula_accepted' WHERE id = $1 RETURNING *`,
    [brief.id],
  );
  res.json(toBrief(rows[0]));
});

app.use('/api', (_req, res) => fail(res, 404, 'Route inconnue'));

/* Toute erreur sort au format { "error": "…" } du contrat */
const onError: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof IaError) return fail(res, error.status, error.message);
  if (isRecord(error) && error.type === 'entity.parse.failed') {
    return fail(res, 400, 'JSON invalide');
  }
  console.error(error);
  fail(res, 500, 'Erreur interne');
};
app.use(onError);

app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
