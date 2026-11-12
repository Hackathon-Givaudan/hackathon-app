/* Petits outils d'affichage partagés par les écrans */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* Classes réutilisées par tous les écrans */
export const primaryButton =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium text-on-ink hover:bg-ink-raised disabled:cursor-wait disabled:opacity-50';
export const linkButton = 'h-11 text-sm underline underline-offset-4';
/* Libellé en casse normale, couleur bronze lisible : pas de capitales espacées (design system) */
export const smallLabel = 'text-[13px] font-medium text-accent-text';
export const errorText = 'mt-3 text-sm text-danger';
