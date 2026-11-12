/* Le parcours d'une marque, joué dans un vrai navigateur, de son projet à sa demande d'échantillon. */
import { expect, test, type Page } from '@playwright/test';

const SEASIDE = 'Une bougie pour un restaurant en bord de mer';

/* Choisit l'univers, part d'un exemple de projet, puis continue */
async function describe(page: Page, universe: string, example: string) {
  await page.goto('/');
  await page.getByRole('button', { name: universe }).click();
  await page.getByRole('button', { name: new RegExp(example) }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
}

const confirm = (page: Page) =>
  page.getByRole('button', { name: 'C’est bien ça, voir la proposition' });

test('a perfume brand goes from its project to a sample request', async ({
  page,
}) => {
  await describe(page, 'Un parfum', SEASIDE);

  // Le récapitulatif : ce que nous avons compris, et les notes qui en découlent
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Voici ce que nous avons compris.',
  );
  await expect(
    page.locator('p', { hasText: 'Nous avons entendu' }),
  ).toContainText('bord de mer');
  await expect(page.getByRole('button', { name: /sel marin/i })).toBeVisible();

  await confirm(page).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Écume Saline',
  );
  await expect(page.getByText('Pourquoi cette proposition')).toBeVisible();

  await page.getByRole('button', { name: 'Demander un échantillon' }).click();
  await expect(page.getByText('Votre demande est envoyée')).toBeVisible();
  await expect(page.getByText('Votre parfumeur ajuste')).toBeVisible();
});

test('a flavour brand follows the same journey with its own words', async ({
  page,
}) => {
  await describe(page, 'Un arôme alimentaire', 'Un yaourt');

  await confirm(page).click();
  await page.getByRole('button', { name: 'Demander un échantillon' }).click();
  await expect(page.getByText('Votre aromaticien ajuste')).toBeVisible();
});

test('a brand can write its project with its own words', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Un parfum' }).click();
  await page
    .getByLabel('Votre projet')
    .fill('Un diffuseur pour un jardin, calme');
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(confirm(page)).toBeVisible();
});

test('a brand that does not know what to write can be guided', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Un parfum' }).click();
  await page.getByRole('button', { name: 'Me laisser guider' }).click();
  for (const answer of ['bougie', 'bord de mer', 'évasion']) {
    await page.getByRole('button', { name: answer, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByRole('button', { name: /sel marin/i })).toBeVisible();
});

test('a brand cannot continue without keeping a note', async ({ page }) => {
  await describe(page, 'Un parfum', SEASIDE);

  await expect(confirm(page)).toBeVisible();
  const kept = page.getByRole('button', { pressed: true });
  while ((await kept.count()) > 0) await kept.first().click();

  await expect(page.getByText('Gardez au moins une note.')).toBeVisible();
  await expect(confirm(page)).toBeDisabled();
});

test('the home says what the brand gets before any choice', async ({
  page,
}) => {
  await page.goto('/');

  // Les trois temps du parcours, annoncés avant le premier clic
  for (const promise of ['Vous décrivez', 'Nous traduisons', 'Vous recevez']) {
    await expect(page.getByText(promise)).toBeVisible();
  }
});

test('technical words are explained where they appear', async ({ page }) => {
  await describe(page, 'Un parfum', SEASIDE);
  await expect(page.getByText('Une note est une odeur')).toBeVisible();

  await confirm(page).click();
  await expect(page.getByText('ce que l’on sent en premier')).toBeVisible();
});

test('a long title stays whole on a narrow screen', async ({ page }) => {
  // Ticket #57 : l'animation d'entrée laissait un masque sur le titre, qui coupait sa deuxième ligne
  await page.setViewportSize({ width: 390, height: 844 });
  await describe(page, 'Un parfum', SEASIDE);
  await confirm(page).click();

  const title = page.getByRole('heading', { level: 1 });
  await expect(title).toHaveText('Écume Saline');
  await expect(title).toHaveCSS('clip-path', 'none');
});
