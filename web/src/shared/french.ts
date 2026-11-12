/* Les petites règles de français que l'écran doit respecter */

/* « de » devant un nom : « d’Écume Saline », « de Marée du soir » */
export function of(name: string): string {
  return /^[aeiouyàâéèêëîïôöùûü]/i.test(name.trim())
    ? `d’${name.trim()}`
    : `de ${name.trim()}`;
}

/* Un montant tapé par la marque : des chiffres et un seul séparateur décimal */
export function cleanNumber(typed: string): string {
  const kept = typed.replace(/[^\d.,]/g, '');
  const at = kept.search(/[.,]/);
  return at < 0
    ? kept
    : kept.slice(0, at + 1) + kept.slice(at + 1).replace(/[.,]/g, '');
}
