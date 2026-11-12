/* Appels réels à l'API, route par route, comme dans openapi.yaml */
import type { Api, Brief, Formula, Turn } from './types';

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
    throw new Error(data.error ?? 'Le service ne répond pas, réessayez.');
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
};
