/* Les petites règles de français que l'écran doit respecter */
import { expect, test } from 'vitest';
import { cleanNumber, of } from './french';

test('a name that starts with a vowel takes an elided « de »', () => {
  expect(of('Écume Saline')).toBe('d’Écume Saline');
  expect(of('Ambre Doré')).toBe('d’Ambre Doré');
});

test('a name that starts with a consonant keeps « de »', () => {
  expect(of('Marée du soir')).toBe('de Marée du soir');
  expect(of('Velours Ambré')).toBe('de Velours Ambré');
});

test('a typed amount keeps its digits and a single separator', () => {
  expect(cleanNumber('abc')).toBe('');
  expect(cleanNumber('-50')).toBe('50');
  expect(cleanNumber('12,5')).toBe('12,5');
  expect(cleanNumber('1.2.3,4')).toBe('1.234');
  expect(cleanNumber('120 €')).toBe('120');
});
