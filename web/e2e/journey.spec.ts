/* Le parcours d'une marque, joué dans un vrai navigateur, du premier choix à la formule acceptée. */
import { expect, test, type Page } from '@playwright/test';

/* Répond aux trois questions, puis demande les notes */
async function describe(page: Page, universe: string, answers: string[]) {
  await page.goto('/');
  await page.getByRole('button', { name: universe }).click();
  for (const answer of answers) {
    await page.getByRole('button', { name: answer, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Traduire en notes' }).click();
}

test('a perfume brand goes from its wishes to an accepted formula', async ({
  page,
}) => {
  await describe(page, 'Un parfum', ['bougie', 'bord de mer', 'évasion']);
  await expect(page.getByRole('button', { name: /sel marin/i })).toBeVisible();

  await page.getByRole('button', { name: /^Valider \d notes?$/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Écume Saline',
  );

  await page.getByRole('button', { name: 'Accepter cette formule' }).click();
  await expect(page.getByText('Formule acceptée')).toBeVisible();
  await expect(page.getByText('Votre parfumeur ajuste')).toBeVisible();
});

test('a flavour brand follows the same journey with its own words', async ({
  page,
}) => {
  await describe(page, 'Un arôme alimentaire', [
    'yaourt',
    'goûter',
    'gourmandise',
  ]);

  await page.getByRole('button', { name: /^Valider \d notes?$/ }).click();
  await page.getByRole('button', { name: 'Accepter cette formule' }).click();
  await expect(page.getByText('Votre aromaticien ajuste')).toBeVisible();
});

test('a brand cannot continue without keeping a note', async ({ page }) => {
  await describe(page, 'Un parfum', ['bougie', 'bord de mer', 'évasion']);

  await expect(page.getByRole('button', { name: /^Valider/ })).toBeVisible();
  const kept = page.getByRole('button', { pressed: true });
  while ((await kept.count()) > 0) await kept.first().click();

  await expect(page.getByText('Gardez au moins une note.')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Valider/ })).toBeDisabled();
});
