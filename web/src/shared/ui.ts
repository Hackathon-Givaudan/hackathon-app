/* Petits outils d'affichage partagés par les écrans */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* Classes réutilisées par tous les écrans */
export const primaryButton =
  'inline-flex h-12 items-center justify-center gap-2 bg-[#F2ECF0] px-6 text-sm font-medium text-[#22101F] hover:bg-white disabled:cursor-wait disabled:opacity-60';
export const linkButton = 'h-11 text-sm underline underline-offset-4';
export const smallLabel = 'mono text-[11px] uppercase tracking-[.08em]';
export const errorText = 'mt-3 text-sm text-[#FFB9C4]';
