/* Le parcours d'une marque, joué dans un vrai navigateur, de son projet à sa demande d'échantillon. */
import { expect, test, type Page } from '@playwright/test';

const SEASIDE = 'Une bougie pour un restaurant en bord de mer';
const CLOSING = "J'ai ce qu'il me faut";

/* Attend qu'Aurore ait parlé `count` fois */
const talk = (page: Page, count: number) =>
  expect(page.locator('[data-who="aurore"]')).toHaveCount(count);

/* La séance : part d'un exemple de projet et répond à Aurore jusqu'au bout */
async function describe(page: Page, universe: string, example: string) {
  await page.goto('/');
  await page.getByRole('button', { name: universe }).click();
  await page.getByRole('button', { name: new RegExp(example) }).click();
  await talk(page, 2);
  // S'il manque encore une émotion, la marque la donne
  if (!(await page.getByText(CLOSING).isVisible())) {
    await page
      .getByLabel('Votre réponse')
      .fill('De la gourmandise et de l’évasion');
    await page.getByRole('button', { name: 'Envoyer' }).click();
    await talk(page, 3);
  }
  await page.getByRole('button', { name: 'Voir mon brief' }).click();
}

/* Le plateau : donne le même avis sur chaque fiole, jusqu'à la dernière */
async function smell(page: Page, opinion: string) {
  const choice = page.getByRole('button', { name: opinion, exact: true });
  await expect(choice).toBeVisible();
  while (await choice.isVisible()) await choice.click();
}

const compose = (page: Page) =>
  page.getByRole('button', { name: 'Composer ma formule' });

/* De l'accueil au plateau, sans répondre aux questions du profil */
async function reachTray(page: Page, universe: string, example: string) {
  await describe(page, universe, example);
  await page.getByRole('button', { name: 'Passer cette étape' }).click();
}

test('a perfume brand goes from its project to a sample request', async ({
  page,
}) => {
  await describe(page, 'Un parfum', SEASIDE);

  // Le brief : ce qu'Aurore a entendu, puis cinq questions à deux choix
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Voici votre brief.',
  );
  await expect(page.getByText('bord de mer')).toBeVisible();
  for (const answer of [
    'Le soir',
    'L’été',
    'Le calme',
    'L’évasion',
    'L’élégance',
  ]) {
    await page.getByRole('button', { name: answer, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Voir mon plateau' }).click();

  // Le plateau : un avis par fiole
  await smell(page, 'Je l’aime');
  await compose(page).click();
  await expect(page.getByText('Pourquoi cette proposition')).toBeVisible();

  await page.getByRole('button', { name: 'Demander un échantillon' }).click();
  await expect(page.getByText('Votre demande est envoyée')).toBeVisible();
  await expect(page.getByText('Votre parfumeur ajuste')).toBeVisible();
});

test('a flavour brand follows the same journey with its own words', async ({
  page,
}) => {
  await reachTray(page, 'Un arôme alimentaire', 'Un yaourt');
  await smell(page, 'Je l’aime');
  await compose(page).click();

  await page.getByRole('button', { name: 'Demander un échantillon' }).click();
  await expect(page.getByText('Votre aromaticien ajuste')).toBeVisible();
});

test('aurore writes down what she hears, with the words of the brand', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Un parfum' }).click();
  await expect(page.getByText('Racontez-moi votre projet.')).toBeVisible();

  await page.getByLabel('Votre réponse').fill(SEASIDE);
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await talk(page, 2);

  const heard = page.getByRole('region', { name: 'Ce que j’entends' });
  await expect(heard.getByText('bord de mer', { exact: true })).toBeVisible();
  await expect(heard.getByText(`« ${SEASIDE} »`).first()).toBeVisible();
});

test('the brand can remove something aurore misheard', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Un parfum' }).click();
  await page.getByLabel('Votre réponse').fill(SEASIDE);
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await talk(page, 2);

  const heard = page.getByRole('region', { name: 'Ce que j’entends' });
  await heard.getByRole('button', { name: 'Retirer bougie' }).click();
  await expect(heard.getByText('bougie', { exact: true })).toHaveCount(0);
});

test('a brand cannot compose without keeping a vial', async ({ page }) => {
  await reachTray(page, 'Un parfum', SEASIDE);
  await smell(page, 'Pas pour moi');

  await expect(page.getByText('Gardez au moins une fiole.')).toBeVisible();
  await expect(compose(page)).toBeDisabled();
});

test('the brand can change its mind on a vial', async ({ page }) => {
  await reachTray(page, 'Un parfum', SEASIDE);
  await smell(page, 'Pas pour moi');

  // Sur la feuille de composition, un clic reprend une fiole écartée
  await page
    .getByRole('button', { name: /Reprendre/ })
    .first()
    .click();
  await expect(compose(page)).toBeEnabled();
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
  await reachTray(page, 'Un parfum', SEASIDE);
  await expect(page.getByText('Une note est une odeur')).toBeVisible();

  await smell(page, 'Je l’aime');
  await compose(page).click();
  await expect(page.getByText('ce que l’on sent en premier')).toBeVisible();
});

test('a long title stays whole on a narrow screen', async ({ page }) => {
  // Ticket #57 : l'animation d'entrée laissait un masque sur le titre, qui coupait sa deuxième ligne
  await page.setViewportSize({ width: 390, height: 844 });
  await reachTray(page, 'Un parfum', SEASIDE);
  await smell(page, 'Je l’aime');
  await compose(page).click();

  const title = page.getByRole('heading', { level: 1 });
  await expect(title).toHaveText('Écume Saline');
  await expect(title).toHaveCSS('clip-path', 'none');
});
