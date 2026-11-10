/* Le seul fichier de l'API qui parle au service Data/IA (ia/) : une fonction par route.
   Les types sont ceux de openapi.yaml. */

export type Universe = 'parfum' | 'arome';

export type Note = {
  id: string;
  label: string;
  family: string;
  reason?: string;
};

export type Formula = {
  id: string;
  name: string;
  notes: { note: Note; share: number }[];
  explanation: string;
  source: string;
};

/* Une erreur du service, déjà traduite dans le code HTTP que l'API renvoie */
export class IaError extends Error {
  constructor(
    readonly status: 400 | 502,
    message: string,
  ) {
    super(message);
  }
}

const UNAVAILABLE = 'Service IA indisponible, réessayez';
const TIMEOUT_MS = 30_000;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNote(value: unknown): value is Note {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.family === 'string' &&
    (value.reason === undefined || typeof value.reason === 'string')
  );
}

function isFormula(value: unknown): value is Formula {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.explanation === 'string' &&
    typeof value.source === 'string' &&
    Array.isArray(value.notes) &&
    value.notes.every(
      (item) =>
        isRecord(item) && isNote(item.note) && Number.isInteger(item.share),
    )
  );
}

async function call(path: string, body: unknown): Promise<unknown> {
  // Lu à chaque appel : api/.env est chargé après l'import de ce fichier
  const baseUrl = process.env.DATA_AI_URL;
  if (!baseUrl) throw new IaError(502, UNAVAILABLE);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new IaError(502, UNAVAILABLE);
  }
  const data: unknown = await response.json().catch(() => null);

  // 422 : le service a compris la demande, mais rien ne lui correspond
  if (response.status === 422) {
    const detail = isRecord(data) ? data.detail : undefined;
    throw new IaError(
      400,
      typeof detail === 'string'
        ? detail
        : 'Rien ne correspond à cette demande',
    );
  }
  if (!response.ok) throw new IaError(502, UNAVAILABLE);
  return data;
}

export async function proposeNotes(
  universe: Universe,
  wishes: string,
): Promise<Note[]> {
  const data = await call('/notes', { universe, wishes });
  const notes = isRecord(data) ? data.notes : undefined;
  if (!Array.isArray(notes) || notes.length === 0 || !notes.every(isNote)) {
    throw new IaError(502, UNAVAILABLE);
  }
  return notes;
}

export async function proposeFormula(
  universe: Universe,
  wishes: string,
  noteIds: string[],
): Promise<Formula> {
  const data = await call('/formula', { universe, wishes, noteIds });
  if (!isFormula(data)) throw new IaError(502, UNAVAILABLE);
  return data;
}
