/* Point d'entrée unique du front vers l'API : un écran n'appelle jamais fetch lui-même */
export { httpApi as api } from './http';
export type {
  Brief,
  BriefDetails,
  Formula,
  Idea,
  Material,
  Note,
  Potential,
  Universe,
} from './types';
