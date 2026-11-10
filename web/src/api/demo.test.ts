/* Les règles du mode démonstration, celles que la marque voit à l'écran.
   Référence utilisée : « Écume Saline » (sel marin, algue, bord de mer). */
import { expect, test } from 'vitest';
import { demoApi } from './demo';

const seaside = 'Produit : bougie. Ambiance : bord de mer. Émotion : évasion.';

test('wishes become at most six notes, each with a reason', async () => {
  const brief = await demoApi.createBrief('parfum', seaside);

  expect(brief.status).toBe('notes_proposed');
  expect(brief.proposedNotes.map((note) => note.id)).toContain('sel-marin');
  expect(brief.proposedNotes.length).toBeLessThanOrEqual(6);
  expect(brief.proposedNotes.every((note) => note.reason)).toBe(true);
});

test('wishes that match nothing are refused with a clear message', async () => {
  await expect(demoApi.createBrief('parfum', 'azerty qwerty')).rejects.toThrow(
    'Nous n’avons pas reconnu votre projet',
  );
});

test('a flavour brief never receives perfume notes', async () => {
  // « bord de mer » désigne un parfum : côté arôme, seule la fraise doit répondre
  const brief = await demoApi.createBrief('arome', 'Fraise, bord de mer');
  const families = brief.proposedNotes.map((note) => note.family);

  expect(families).not.toContain('Aquatique');
  expect(brief.proposedNotes.length).toBeGreaterThan(0);
});

test('the formula is the reference closest to the validated notes', async () => {
  const brief = await demoApi.createBrief('parfum', seaside);
  await demoApi.validateNotes(brief.id, ['sel-marin', 'algue']);
  const formula = await demoApi.proposeFormula(brief.id);

  expect(formula.name).toBe('Écume Saline');
  const total = formula.notes.reduce((sum, line) => sum + line.share, 0);
  expect(total).toBe(100);
});

test('a note the brand removed is named in the explanation', async () => {
  const brief = await demoApi.createBrief('parfum', seaside);
  await demoApi.validateNotes(brief.id, ['sel-marin']);
  const formula = await demoApi.proposeFormula(brief.id);

  expect(formula.explanation).toContain('Elle contient aussi algue');
});

test('the steps cannot be played out of order', async () => {
  const brief = await demoApi.createBrief('parfum', seaside);

  await expect(demoApi.proposeFormula(brief.id)).rejects.toThrow(
    'Validez les notes avant de demander une formule',
  );
  await expect(demoApi.validateNotes(brief.id, [])).rejects.toThrow(
    'Gardez au moins une note.',
  );
});
