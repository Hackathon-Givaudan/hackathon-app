/* Couleur d'une note dans le flacon, d'après son nom. Purement illustratif. */
const PALETTE: [RegExp, string][] = [
  [
    /citron|bergamote|pamplemousse|orange|agrume|yuzu|mandarine|ananas|mangue|passion/,
    '#D8BE3F',
  ],
  [/iris|violette|lavande|lilas|figue|cassis|mure|myrtille/, '#8E7CC9'],
  [
    /rose|pivoine|fraise|framboise|cerise|fleur|jasmin|neroli|hibiscus/,
    '#D98BB0',
  ],
  [/sel|marin|algue|ozone|menthe|aquatique|eucalyptus|concombre/, '#6FA3A0'],
  [/the|herbe|basilic|sauge|vert|feuille|matcha|thym|romarin/, '#8FA66B'],
  [/vanille|creme|lait|lacte|miel|amande|coco|biscuit|beurre/, '#D9B36A'],
  [
    /caramel|ambre|cannelle|epice|gingembre|poivre|safran|tonka|praline/,
    '#C2702F',
  ],
  [
    /cedre|santal|bois|vetiver|patchouli|noisette|cafe|cacao|chocolat|torrefi|cuir|tabac|fume|encens/,
    '#8A6240',
  ],
];

export function noteColor(label: string) {
  const plain = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return PALETTE.find(([pattern]) => pattern.test(plain))?.[1] ?? '#B9AEBF';
}
