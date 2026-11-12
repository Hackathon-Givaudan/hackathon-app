/* Point d'entrée unique du front vers l'API : un écran n'appelle jamais fetch lui-même */
export { httpApi as api } from './http';
export type { Brief, Formula, Idea, Note, Universe } from './types';
