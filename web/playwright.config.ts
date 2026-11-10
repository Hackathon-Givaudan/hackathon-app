import { defineConfig } from '@playwright/test';

/* Les tests de bout en bout lancent le front en mode démonstration : ni API ni modèle.
   Le navigateur de test tourne sans WebGL : il ne dessine pas le flacon 3D, ce qui
   garde les tests rapides et prouve que le parcours reste utilisable sans lui. */
export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:5173',
    launchOptions: { args: ['--disable-3d-apis'] },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
