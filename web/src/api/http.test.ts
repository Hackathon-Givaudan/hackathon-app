/* Ce que le front fait des réponses de l'API. L'API est simulée : aucun appel réseau. */
import { afterEach, expect, test, vi } from 'vitest';
import { httpApi } from './http';

function apiAnswers(status: number, body: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(body, { status })),
  );
}

afterEach(() => vi.unstubAllGlobals());

test('the wishes go to the route of the contract', async () => {
  apiAnswers(201, '{"id": 1}');
  await httpApi.createBrief('parfum', 'bord de mer');

  expect(fetch).toHaveBeenCalledWith(
    '/api/briefs',
    expect.objectContaining({
      method: 'POST',
      body: '{"universe":"parfum","wishes":"bord de mer"}',
    }),
  );
});

test('an error of the API is shown with its own message', async () => {
  apiAnswers(400, '{"error": "Aucune note ne correspond à ces envies"}');

  await expect(httpApi.createBrief('parfum', 'xyz')).rejects.toThrow(
    'Aucune note ne correspond à ces envies',
  );
});

test('an answer that is not JSON gives a message the brand can read', async () => {
  apiAnswers(502, '<html>Bad Gateway</html>');

  await expect(httpApi.proposeFormula(1)).rejects.toThrow(
    'Le service ne répond pas, réessayez.',
  );
});
