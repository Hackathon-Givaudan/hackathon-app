/* Point d'entrée unique du front vers l'API.
   VITE_API_MODE=live appelle l'API réelle ; sinon, mode démonstration. */
import { demoApi } from './demo';
import { httpApi } from './http';

export const isDemo = import.meta.env.VITE_API_MODE !== 'live';
export const api = isDemo ? demoApi : httpApi;
export type { Brief, Formula, Note, Universe } from './types';
