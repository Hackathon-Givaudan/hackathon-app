/* Appels réels à l'API, route par route, comme dans openapi.yaml */
import type { Api, Brief, Formula, Material, Potential, Turn } from './types';

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(
      new Error(data.error ?? 'Le service ne répond pas, réessayez.'),
      { status: response.status },
    );
  }
  return data as T;
}

export const httpApi: Api = {
  sessionTurn: (universe, said, heard) =>
    call<Turn>('POST', '/session/turn', { universe, said, heard }),
  createBrief: (universe, wishes) =>
    call<Brief>('POST', '/briefs', { universe, wishes }),
  validateNotes: (briefId, noteIds) =>
    call<Brief>('PUT', `/briefs/${briefId}/notes`, { noteIds }),
  proposeFormula: (briefId) =>
    call<Formula>('POST', `/briefs/${briefId}/formula`),
  acceptFormula: (briefId) =>
    call<Brief>('POST', `/briefs/${briefId}/formula/acceptance`),
  material: (noteId) =>
    call<Material>('GET', `/materials/${encodeURIComponent(noteId)}`).catch(
      (error: Error & { status?: number }) => {
        // Une note sans fiche n'est pas une panne : l'écran dit « fiche à venir »
        if (error.status === 404) return null;
        throw error;
      },
    ),
  completeBrief: (briefId, details) =>
    call<Brief>('PUT', `/briefs/${briefId}/details`, details),
  listBriefs: () =>
    call<{ briefs: Brief[] }>('GET', '/briefs').then(({ briefs }) => briefs),
  potential: (briefId) =>
    call<Potential>('GET', `/briefs/${briefId}/potential`),
  giveFeedback: (briefId, adjustments) =>
    call<Brief>('POST', `/briefs/${briefId}/feedback`, { adjustments }),
};
