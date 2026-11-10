import { defineConfig } from '@playwright/test';

/* Les tests de bout en bout jouent le parcours sur la tranche réelle : le front, l'API,
   PostgreSQL et le service ia/ doivent tourner (voir web/README.md).
   Le navigateur de test tourne sans WebGL : il ne dessine pas le flacon 3D, ce qui
   garde les tests rapides et prouve que le parcours reste utilisable sans lui. */
export default defineConfig({
  testDir: 'e2e',
  /* Le modèle répond en 3 à 9 secondes */
  expect: { timeout: 30_000 },
  use: {
    baseURL: 'http://localhost:5173',
    launchOptions: { args: ['--disable-3d-apis'] },
  },
  webServer: {
    /* L'API et le front, lancés depuis la racine du dépôt */
    command: 'npm run dev',
    cwd: '..',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
