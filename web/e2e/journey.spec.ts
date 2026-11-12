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
  const resume = page.getByRole('button', { name: 'C’est reparti' });
  await expect(choice).toBeVisible();
  // À mi-plateau, une pause café : on repart et on continue
  while ((await choice.isVisible()) || (await resume.isVisible())) {
    await ((await resume.isVisible()) ? resume : choice).click();
  }
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
  await page.getByRole('button', { name: /^Établir mon profil/ }).click();
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
  // Aurore a dit qu'elle avait de quoi rédiger : le brief ne dit donc pas qu'il manque quelque chose
  await expect(page.getByText('Ce qu’Aurore a entendu')).toBeVisible();
  await expect(page.getByText(/Rien n’est obligatoire/)).toBeVisible();
  await expect(page.getByText(/Il manque/)).toHaveCount(0);
  await page.getByRole('button', { name: /^Établir mon profil/ }).click();
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

  await page.getByRole('button', { name: /^Recevoir l’échantillon/ }).click();
  await expect(page.getByText('prend forme.')).toBeVisible();
  await expect(page.getByText('Votre parfumeur ajuste')).toBeVisible();
});

test('a flavour brand follows the same journey with its own words', async ({
  page,
}) => {
  await reachTray(page, 'Un arôme alimentaire', 'Un yaourt');
  await smell(page, 'Je l’aime');
  await compose(page).click();

  // Un arôme n'est pas contrôlé comme un parfum : pas d'IFRA, pas de test sur peau
  await expect(page.getByText('Validée par un aromaticien')).toBeVisible();
  await expect(page.getByText(/IFRA|sur peau/)).toHaveCount(0);
  await page.getByRole('button', { name: /^Recevoir l’échantillon/ }).click();
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
  await page.getByRole('button', { name: /^Recevoir l’échantillon/ }).click();
  await expect(page.getByText('Marée du soir', { exact: true })).toBeVisible();

  // Le devis de Karim : les montants inconnus restent [X]
  await expect(page.getByText('Prix au kilo')).toBeVisible();
  await page.getByRole('button', { name: 'Accepter le devis' }).click();
  await expect(page.getByText(/Devis accepté/)).toBeVisible();

  // Le suivi, puis le retour après essai
  await page
    .getByRole('button', { name: 'Simuler la réception de l’échantillon' })
    .click();
  await page.getByRole('button', { name: 'Plus de fraîcheur' }).click();
  await expect(page.getByText('Votre retour est noté.')).toBeVisible();
  await page.getByRole('button', { name: 'Commander cette version' }).click();
  await expect(
    page.getByRole('button', { name: 'Commande notée' }),
  ).toBeVisible();
  await expect(page.getByText(/transmise à Karim/)).toHaveCount(0);

  // Le retour est enregistré : le conseiller le lit dans le brief
  await expect
    .poll(async () => {
      const { briefs } = await (await page.request.get('/api/briefs')).json();
      return briefs[0].feedback;
    })
    .toEqual(['plus_de_fraicheur']);
});

test('the profile does not ask again what the session already settled', async ({
  page,
}) => {
  await describe(page, 'Un parfum', 'Un diffuseur pour les soirées d’hiver');
  await page.getByRole('button', { name: /^Établir mon profil/ }).click();

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
  await page.getByRole('button', { name: /^Établir mon profil/ }).click();
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
  // La première fiole, le sel marin, a une fiche documentée par la Data
  await expect(sheet.getByText(/Origine|Obtention/).first()).toBeVisible();
  // La famille est celle de la note (iodée), pas celle de la référence qui la contient
  await expect(sheet.getByText('Iodée')).toBeVisible();
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

  const progress = page.getByRole('status', { name: 'Précisions données' });
  await expect(progress).toHaveText(/0 sur 11/);
  await page.getByLabel('Budget visé au kilo').fill('120');
  await page.getByRole('button', { name: 'Grand public' }).click();
  await page.getByRole('button', { name: 'France', exact: true }).click();
  await page.getByRole('button', { name: 'Asie', exact: true }).click();
  await expect(progress).toHaveText(/3 sur 11/);
});

test('the brand can hesitate on a vial, or say what it reminds her of', async ({
  page,
}) => {
  await reachTray(page, 'Un parfum', SEASIDE);

  // « Je ne sais pas » : le guide repose la question autrement
  await page.getByRole('button', { name: 'Je ne sais pas' }).click();
  await page.getByRole('button', { name: 'Elle alourdit' }).click();
  await expect(page.getByText(/fiole 2 sur/)).toBeVisible();

  // « Ça me rappelle… » : la marque dit quoi, et la fiole est gardée
  const second = await page.getByRole('heading', { level: 1 }).innerText();
  await page.getByRole('button', { name: 'Ça me rappelle…' }).click();
  await page.getByLabel('Ce que cette fiole vous rappelle').fill('Un jardin');
  await page.getByRole('button', { name: 'Je la garde' }).click();
  const sheet = page.getByRole('region', {
    name: 'Votre feuille de composition',
  });
  await expect(sheet.getByText(second, { exact: false })).toBeVisible();
});

test('a coffee break rests the nose halfway through the tray', async ({
  page,
}) => {
  await reachTray(page, 'Un parfum', SEASIDE);
  const love = page.getByRole('button', { name: 'Je l’aime', exact: true });
  const pause = page.getByRole('heading', { name: 'Pause café.' });
  while (!(await pause.isVisible())) await love.click();
  await page.getByRole('button', { name: 'C’est reparti' }).click();
  await expect(love).toBeVisible();
});

/* Un parcours complet et court, jusqu'à la demande d'échantillon */
async function orderSample(page: Page) {
  await describe(page, 'Un parfum', SEASIDE);
  await page.getByLabel('Budget visé au kilo').fill('120');
  await page.getByLabel('Volume annuel').fill('500');
  await page.getByRole('button', { name: 'Grand public' }).click();
  await page.getByRole('button', { name: 'France', exact: true }).click();
  await page.getByRole('button', { name: /^Établir mon profil/ }).click();
  await page.getByRole('button', { name: 'Passer cette étape' }).click();
  await openKit(page);
  await smell(page, 'Je l’aime');
  await compose(page).click();
  await page.getByRole('button', { name: /^Recevoir l’échantillon/ }).click();
  await expect(page.getByText('prend forme.')).toBeVisible();
}

test('what the brand adds to its brief is saved with it', async ({ page }) => {
  await orderSample(page);
  const { briefs } = await (await page.request.get('/api/briefs')).json();
  expect(briefs[0].details).toEqual({
    budgetPerKg: 120,
    annualVolumeKg: 500,
    target: 'grand_public',
    salesCountries: ['france'],
  });
});

test('the brand finds its briefs and formulas in its space', async ({
  page,
}) => {
  await orderSample(page);
  await page.getByRole('button', { name: 'Léa · Mon espace' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Bonjour Léa.',
  );
  const briefs = page.getByRole('region', { name: 'Mes briefs' });
  await expect(briefs.getByText(/bord de mer/).first()).toBeVisible();
  const formulas = page.getByRole('region', { name: 'Mes formules' });
  await expect(formulas.getByRole('listitem').first()).toBeVisible();
  await page.getByRole('button', { name: 'Revenir à l’atelier' }).click();
  await expect(page.getByText('prend forme.')).toBeVisible();
});

test('the advisor reads the brief and its potential in seven criteria', async ({
  page,
}) => {
  await orderSample(page);
  await page.getByRole('button', { name: 'Espace conseiller' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Tableau de bord',
  );
  await page
    .getByRole('button', { name: /^Ouvrir le brief/ })
    .first()
    .click();

  // Ce que la marque a précisé, puis les sept critères et une suggestion
  const given = page.getByRole('region', { name: 'Précisions du brief' });
  await expect(given.getByText('Grand public')).toBeVisible();
  await expect(given.getByText('120 € / kg')).toBeVisible();
  const criteria = page.getByRole('region', { name: 'Critères' });
  await expect(criteria.getByRole('listitem')).toHaveCount(7);
  await expect(criteria.getByText(/^Suggestion :/)).toBeVisible();
  // Givaudan n'a pas donné de seuil de volume : il reste [X]
  await expect(criteria.getByText(/seuil Givaudan \[X\]/)).toBeVisible();
});

test('the profile wheel follows the brief and each answer', async ({
  page,
}) => {
  await describe(page, 'Un parfum', SEASIDE);
  await page.getByRole('button', { name: /^Établir mon profil/ }).click();

  // Le brief parle de bord de mer : la roue penche déjà vers le marin
  const wheel = page.getByRole('region', { name: 'Votre roue olfactive' });
  await expect(wheel.getByRole('status')).toContainText('marin');
  // Rien n'a été dit sur les agrumes : la roue ne les cite pas
  await expect(wheel.getByRole('status')).not.toContainText('hespéridé');
  // Deux réponses chaudes, et la roue penche vers l'ambré
  await page.getByRole('button', { name: 'L’hiver', exact: true }).click();
  await page.getByRole('button', { name: 'Le réconfort', exact: true }).click();
  await expect(wheel.getByRole('status')).toContainText('ambré');
  // Aucun bouton ne prétend régler la roue à la main
  await expect(wheel.getByRole('button')).toHaveCount(0);
});

test('the workshop notebook says where the brand is', async ({ page }) => {
  await enter(page, 'Un parfum');
  await expect(
    page.getByRole('status', { name: 'Carnet d’atelier' }),
  ).toHaveText(/étape 3 sur 8 · Séance/);
});

/* Rien ne doit dépasser de l'écran d'un téléphone : ni page qui défile de côté, ni texte coupé */
async function expectNothingOverflows(page: Page, screen: string) {
  const overflowing = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && (box.right > width + 1 || box.left < -1);
      })
      .map(
        (element) =>
          `${element.tagName.toLowerCase()} « ${(element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 40)} »`,
      )
      .slice(0, 5);
  });
  expect(overflowing, `ce qui dépasse sur l'écran « ${screen} »`).toEqual([]);
}

test('nothing overflows on a phone, from the home to the recall', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expectNothingOverflows(page, 'accueil');
  await page.getByRole('button', { name: 'Un parfum' }).click();
  await expectNothingOverflows(page, 'bienvenue');
  await page.getByRole('button', { name: 'Commencer la séance' }).click();
  await page.getByRole('button', { name: new RegExp(SEASIDE) }).click();
  await talk(page, 2);
  await expectNothingOverflows(page, 'séance');
  if (!(await page.getByText(CLOSING).isVisible())) {
    await page.getByLabel('Votre réponse').fill('De l’évasion et du calme');
    await page.getByRole('button', { name: 'Envoyer' }).click();
    await talk(page, 3);
  }
  await page.getByRole('button', { name: 'Voir mon brief' }).click();
  await expectNothingOverflows(page, 'brief');
  await page.getByRole('button', { name: /^Établir mon profil/ }).click();
  await expectNothingOverflows(page, 'profil');
  await page.getByRole('button', { name: 'Passer cette étape' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Votre parcours se fait en deux temps.',
  );
  await expectNothingOverflows(page, 'offres du plateau');
  await page.getByRole('button', { name: /^Recevoir mon plateau/ }).click();
  await expectNothingOverflows(page, 'validation par Karim');
  await page
    .getByRole('button', { name: 'Démo : Karim a validé le plateau' })
    .click();
  await expectNothingOverflows(page, 'livraison');
  await page
    .getByRole('button', {
      name: 'Démo : le plateau est arrivé, je me reconnecte',
    })
    .click();
  await expectNothingOverflows(page, 'reprise');
  await page.getByRole('button', { name: /^Commencer maintenant/ }).click();
  await expect(page.getByText(/fiole 1 sur/)).toBeVisible();
  await expectNothingOverflows(page, 'fioles');
  await smell(page, 'Je l’aime');
  await expectNothingOverflows(page, 'feuille de composition');
  await compose(page).click();
  await expect(page.getByText('Pourquoi cette proposition')).toBeVisible();
  await expectNothingOverflows(page, 'formule');
  await page.getByRole('button', { name: /^Recevoir l’échantillon/ }).click();
  await expect(page.getByText('prend forme.')).toBeVisible();
  await expectNothingOverflows(page, 'suivi et devis');
  await page
    .getByRole('button', { name: 'Simuler la réception de l’échantillon' })
    .click();
  await page.getByRole('button', { name: 'Plus de fraîcheur' }).click();
  await expectNothingOverflows(page, 'rappel');
  await page.getByRole('button', { name: 'Léa · Mon espace' }).click();
  await expect(page.getByText('Bonjour Léa.')).toBeVisible();
  await expectNothingOverflows(page, 'espace client');
  await page.getByRole('button', { name: 'Revenir à l’atelier' }).click();
  await page.getByRole('button', { name: 'Espace conseiller' }).click();
  await page
    .getByRole('button', { name: /^Ouvrir le brief/ })
    .first()
    .click();
  await expect(page.getByText(/^Suggestion :/)).toBeVisible();
  await expectNothingOverflows(page, 'espace conseiller');
});

test('the guide the brand chose is the one it reads everywhere', async ({
  page,
}) => {
  await enter(page, 'Un parfum', 'Victor');
  await expect(page.getByText('La séance · avec Victor')).toBeVisible();
  await page.getByRole('button', { name: 'Aide' }).click();
  const help = page.getByRole('dialog', { name: 'Aide' });
  await expect(help.getByText(/Posez votre question à Victor/)).toBeVisible();
  // Aucun écran ne parle d'Aurore quand la marque a choisi Victor
  await expect(page.getByText(/Aurore/)).toHaveCount(0);
});

test('a flavour brand reads flavour words, not perfume words', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Un arôme alimentaire' }).click();
  await expect(page.getByText(/Aromaticienne IA/)).toBeVisible();
  await expect(page.getByText(/Parfumeu/)).toHaveCount(0);

  await describe(page, 'Un arôme alimentaire', 'Un yaourt');
  await page
    .getByRole('button', { name: 'Établir mon profil gustatif' })
    .click();
  await expect(
    page.getByRole('region', { name: 'Votre roue des saveurs' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Passer cette étape' }).click();
  await expect(
    page.getByRole('button', { name: /^Recevoir mon plateau/ }),
  ).toBeVisible();
  await expect(page.getByText(/parfum|olfacti/i)).toHaveCount(0);
});

test('the brand space does not promise a privacy the prototype lacks', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Léa · Mon espace' }).click();
  await expect(page.getByText(/pas de comptes/)).toBeVisible();
  await expect(page.getByText(/restent privées/)).toHaveCount(0);
});

test('going back from the tray keeps the profile and the same brief', async ({
  page,
}) => {
  await describe(page, 'Un parfum', SEASIDE);
  await page.getByRole('button', { name: /^Établir mon profil/ }).click();
  const answer = page.getByRole('button', { name: 'Le calme', exact: true });
  await answer.click();
  const count = async () =>
    (await (await page.request.get('/api/briefs')).json()).briefs.length;
  const offers = page.getByRole('heading', {
    name: 'Votre parcours se fait en deux temps.',
  });
  await page.getByRole('button', { name: 'Voir mon plateau' }).click();
  await expect(offers).toBeVisible();
  const before = await count();
  await page.getByRole('button', { name: 'Revenir au profil' }).click();

  // La réponse est restée, et repartir ne crée pas un deuxième brief
  await expect(answer).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Voir mon plateau' }).click();
  await expect(offers).toBeVisible();
  expect(await count()).toBe(before);
});

test('the 3D stage appears only when there is something to show', async ({
  page,
}) => {
  // Pendant la séance, rien à montrer : pas de flacon vide qui prend la moitié de l'écran
  await enter(page, 'Un parfum');
  await expect(page.locator('aside.stage')).toHaveCount(0);

  // Au plateau, les fioles sont là
  await reachTray(page, 'Un parfum', SEASIDE);
  await expect(page.locator('aside.stage')).toHaveCount(1);
});

test('the tray offers only what the journey then delivers', async ({
  page,
}) => {
  await describe(page, 'Un parfum', SEASIDE);
  await page.getByRole('button', { name: /^Établir mon profil/ }).click();
  await page.getByRole('button', { name: 'Passer cette étape' }).click();
  await expect(
    page.getByRole('button', { name: /Recevoir un plateau sur mesure/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Utiliser mon kit atelier/ }),
  ).toBeVisible();
  // Pas d'offre « parfums existants » : la suite fait sentir des notes, pas des parfums finis
  await expect(page.getByText(/existants/)).toHaveCount(0);
});

test('going back to the session finds the conversation as it was', async ({
  page,
}) => {
  await describe(page, 'Un parfum', SEASIDE);
  await page.getByRole('button', { name: 'Reprendre la séance' }).click();

  // Les échanges et ce que le guide a retenu sont toujours là
  await expect(page.getByText(new RegExp(SEASIDE)).first()).toBeVisible();
  const heard = page.getByRole('region', { name: 'Ce que je retiens' });
  await expect(heard.getByText('bougie', { exact: true })).toBeVisible();
  await expect(page.getByText(CLOSING)).toBeVisible();
});

test('removing an idea reopens the conversation', async ({ page }) => {
  await enter(page, 'Un parfum');
  await page.getByRole('button', { name: new RegExp(SEASIDE) }).click();
  await expect(page.getByText(CLOSING)).toBeVisible();
  const heard = page.getByRole('region', { name: 'Ce que je retiens' });
  await heard.getByRole('button', { name: 'Retirer bougie' }).click();

  // Le guide ne dit plus qu'il a tout : il redemande ce qui manque
  await expect(page.getByLabel('Votre réponse')).toHaveAttribute(
    'placeholder',
    'Écrivez votre réponse…',
  );
  await expect(
    page.getByRole('group', { name: 'Réponses rapides' }),
  ).toBeVisible();
  await expect(page.locator('[data-who="aurore"]').last()).toContainText(
    'retiré',
  );
});

test('the wording stays true and correct along the demo path', async ({
  page,
}) => {
  await page.goto('/');
  // Le parcours prend plus de deux minutes : l'accueil ne le promet pas
  await expect(page.getByText(/deux\s+minutes/)).toHaveCount(0);

  await reachTray(page, 'Un parfum', SEASIDE);
  await smell(page, 'Je l’aime');
  await compose(page).click();
  // « d'Écume Saline », pas « de Écume Saline »
  const sample = page.getByRole('button', { name: /^Recevoir l’échantillon/ });
  await expect(sample).not.toHaveText(/ de [AEÉÈIOUH]/);
  await sample.click();
  await expect(page.getByText(/chantillon de [AEÉÈIOUH]/)).toHaveCount(0);
  // La demande est enregistrée en base : l'écran ne dit pas qu'elle est envoyée
  await expect(page.getByText('Demande enregistrée')).toBeVisible();
});
