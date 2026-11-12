/* Le parcours d'une marque, joué dans un vrai navigateur, de son projet à sa demande d'échantillon. */
import { expect, test, type Page } from '@playwright/test';

const SEASIDE = 'Une bougie pour un restaurant en bord de mer';
const CLOSING = "J'ai ce qu'il me faut";

/* Attend qu'Aurore ait parlé `count` fois */
const talk = (page: Page, count: number) =>
  expect(page.locator('[data-who="aurore"]')).toHaveCount(count);

/* L'accueil, puis la bienvenue : le compte de Léa est prêt, la marque choisit son guide */
async function enter(page: Page, universe: string, guide = 'Aurore') {
  await page.goto('/');
  await page.getByRole('button', { name: universe }).click();
  await page.getByRole('button', { name: guide, exact: true }).click();
  await page.getByRole('button', { name: 'Commencer la séance' }).click();
}

/* La séance : part d'un exemple de projet et répond à Aurore jusqu'au bout */
async function describe(page: Page, universe: string, example: string) {
  await enter(page, universe);
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

/* Le chemin court vers les fioles : la marque a déjà son kit atelier, rien à attendre */
async function openKit(page: Page) {
  await page.getByRole('button', { name: /Utiliser mon kit atelier/ }).click();
  await page
    .getByRole('button', { name: 'J’ouvre mon kit, on commence' })
    .click();
}

/* De l'accueil au plateau, sans répondre aux questions du profil */
async function reachTray(page: Page, universe: string, example: string) {
  await describe(page, universe, example);
  await page
    .getByRole('button', { name: 'Établir mon profil olfactif' })
    .click();
  await page.getByRole('button', { name: 'Passer cette étape' }).click();
  await openKit(page);
}

test('a perfume brand goes from its project to a sample request', async ({
  page,
}) => {
  await describe(page, 'Un parfum', SEASIDE);

  // Le brief : ce qu'Aurore a entendu, et ce qu'il reste à compléter
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Voici votre brief.',
  );
  await expect(page.getByText('bord de mer')).toBeVisible();
  await page
    .getByRole('button', { name: 'Établir mon profil olfactif' })
    .click();
  // Le profil ne pose que les questions que la séance n'a pas tranchées
  for (const answer of [
    'Le soir',
    'L’été',
    'Le calme',
    'L’évasion',
    'L’élégance',
  ]) {
    const choice = page.getByRole('button', { name: answer, exact: true });
    if (await choice.isVisible()) await choice.click();
  }
  await page.getByRole('button', { name: 'Voir mon plateau' }).click();
  await openKit(page);

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
  await enter(page, 'Un parfum');
  await expect(page.getByText('Racontez-moi votre projet.')).toBeVisible();

  await page.getByLabel('Votre réponse').fill(SEASIDE);
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await talk(page, 2);

  const heard = page.getByRole('region', { name: 'Ce que je retiens' });
  await expect(heard.getByText('bord de mer', { exact: true })).toBeVisible();
  await expect(heard.getByText(`« ${SEASIDE} »`).first()).toBeVisible();
});

test('the brand can remove something aurore misheard', async ({ page }) => {
  await enter(page, 'Un parfum');
  await page.getByLabel('Votre réponse').fill(SEASIDE);
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await talk(page, 2);

  const heard = page.getByRole('region', { name: 'Ce que je retiens' });
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

test('the home shows how the atelier works before entering', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Comment ça marche' }).click();

  const guide = page.getByRole('dialog', { name: 'Comment ça marche' });
  for (const stage of [
    'La séance',
    'Le brief',
    'Le plateau',
    'La formule',
    'L’échantillon',
  ]) {
    await expect(guide.getByText(stage, { exact: true })).toBeVisible();
  }
  await guide.getByRole('button', { name: 'Fermer' }).click();
  await expect(guide).toBeHidden();
});

test('aurore only answers with validated answers', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Aide' }).click();
  const help = page.getByRole('dialog', { name: 'Aide' });

  await help
    .getByLabel('Votre question')
    .fill('Quand vais-je recevoir mon échantillon ?');
  await help.getByRole('button', { name: 'Demander' }).click();
  await expect(
    help.getByText('Votre conseiller Givaudan vous le confirme'),
  ).toBeVisible();

  // Hors de notre projet : Aurore ne répond pas
  await help
    .getByLabel('Votre question')
    .fill('Quelle est la capitale de la France ?');
  await help.getByRole('button', { name: 'Demander' }).click();
  await expect(help.getByText('Je ne peux pas répondre à cela.')).toBeVisible();
});

test('the brand names its creation and follows its sample', async ({
  page,
}) => {
  await reachTray(page, 'Un parfum', SEASIDE);
  await smell(page, 'Je l’aime');
  await compose(page).click();

  await page.getByLabel('Le nom de votre création').fill('Marée du soir');
  await page.getByRole('button', { name: 'Demander un échantillon' }).click();
  await expect(page.getByText('Marée du soir', { exact: true })).toBeVisible();

  // Le suivi, puis le retour après essai
  await page
    .getByRole('button', { name: 'Simuler la réception de l’échantillon' })
    .click();
  await page.getByRole('button', { name: 'Plus de fraîcheur' }).click();
  await expect(page.getByText('Votre retour est noté.')).toBeVisible();
});

test('the profile does not ask again what the session already settled', async ({
  page,
}) => {
  await describe(page, 'Un parfum', 'Un diffuseur pour les soirées d’hiver');
  await page
    .getByRole('button', { name: 'Établir mon profil olfactif' })
    .click();

  // La séance a entendu « hiver » : le profil ne redemande pas « l'été ou l'hiver »
  await expect(page.getByText('Plutôt le calme ou l’énergie ?')).toBeVisible();
  await expect(page.getByText('Plutôt l’été ou l’hiver ?')).toHaveCount(0);
});

test('the brand is welcomed and chooses its guide', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Un parfum' }).click();
  await expect(page.getByText('Léa Martin')).toBeVisible();
  await expect(page.getByText('Maison Lumen', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Victor', exact: true }).click();
  await page.getByRole('button', { name: 'Commencer la séance' }).click();
  await expect(page.getByText('La séance · avec Victor')).toBeVisible();
});

test('the brand waits for its tray, then smells it', async ({ page }) => {
  await describe(page, 'Un parfum', SEASIDE);
  await page
    .getByRole('button', { name: 'Établir mon profil olfactif' })
    .click();
  await page.getByRole('button', { name: 'Passer cette étape' }).click();

  // Écran 07 : trois façons de recevoir ses fioles, celle du conseiller en premier
  const title = page.getByRole('heading', { level: 1 });
  await expect(title).toHaveText('Votre parcours se fait en deux temps.');
  await expect(page.getByText('Recommandé par votre conseiller')).toBeVisible();
  await page.getByRole('button', { name: /^Recevoir mon plateau/ }).click();

  // Écran 07b : Karim vérifie, le délai inconnu reste [X]
  await expect(title).toHaveText('Karim vérifie votre demande.');
  await expect(page.getByText('Sous [X] jours ouvrés')).toBeVisible();
  await page
    .getByRole('button', { name: 'Démo : Karim a validé le plateau' })
    .click();

  // Écran 08 : le suivi de la livraison
  await expect(title).toHaveText('Votre plateau arrive.');
  await expect(page.getByText('En route')).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Démo : le plateau est arrivé, je me reconnecte',
    })
    .click();

  // Écran 08b : la marque se prépare, puis commence
  await expect(title).toHaveText('Votre plateau est arrivé.');
  const ready = page.getByRole('status', { name: 'Préparation' });
  await expect(ready).toHaveText('1 sur 4 prêts');
  await page.getByRole('checkbox', { name: /Un café/ }).check();
  await expect(ready).toHaveText('2 sur 4 prêts');
  await page.getByRole('button', { name: /^Commencer maintenant/ }).click();
  await expect(page.getByText(/fiole 1 sur/)).toBeVisible();
});

test('the composition sheet fills as vials are kept', async ({ page }) => {
  await reachTray(page, 'Un parfum', SEASIDE);
  const sheet = page.getByRole('region', {
    name: 'Votre feuille de composition',
  });
  await expect(
    sheet.getByText('Aucune fiole gardée pour l’instant.'),
  ).toBeVisible();

  const first = await page.getByRole('heading', { level: 1 }).innerText();
  await page.getByRole('button', { name: 'Je l’aime', exact: true }).click();
  await expect(sheet.getByText(first, { exact: false })).toBeVisible();
});

test('each vial shows its material sheet, or says it is coming', async ({
  page,
}) => {
  await reachTray(page, 'Un parfum', SEASIDE);

  const sheet = page.getByRole('region', { name: 'Fiche matière' });
  await expect(sheet).toBeVisible();
  // Une fiche documentée donne son origine ; sinon, elle est annoncée
  await expect(
    sheet.getByText(/Origine|Obtention|Fiche à venir/).first(),
  ).toBeVisible();
});

test('the brand chooses its product before the session', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Un parfum' }).click();
  await page.getByRole('button', { name: 'Bougie', exact: true }).click();
  await page.getByRole('button', { name: 'Commencer la séance' }).click();

  // Le produit choisi ouvre la séance : Aurore l'a déjà retenu
  const heard = page.getByRole('region', { name: 'Ce que je retiens' });
  await expect(heard.getByText('bougie', { exact: true })).toBeVisible();
});

test('quick replies answer aurore in one click', async ({ page }) => {
  await enter(page, 'Un parfum');
  await page.getByLabel('Votre réponse').fill('Une bougie');
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await talk(page, 2);

  const quick = page.getByRole('group', { name: 'Réponses rapides' });
  await quick.getByRole('button').first().click();
  await talk(page, 3);
});

test('the brief says what is left to complete', async ({ page }) => {
  await describe(page, 'Un parfum', SEASIDE);

  const progress = page.getByRole('status', { name: 'Brief complété' });
  await expect(progress).toHaveText(/0 sur 11/);
  await page.getByLabel('Budget visé au kilo').fill('120');
  await page.getByRole('button', { name: 'Grand public' }).click();
  await page.getByRole('button', { name: 'France', exact: true }).click();
  await page.getByRole('button', { name: 'Asie', exact: true }).click();
  await expect(progress).toHaveText(/3 sur 11/);
});
