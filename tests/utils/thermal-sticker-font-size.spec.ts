import { describe, expect, test } from 'bun:test';
import {
  landscapePrimaryFontSize,
  portraitDestinationFontSize,
} from '../../src/features/printing/components/templates/thermal-sticker-font-size.utils';

describe('thermal sticker receiver sizing', () => {
  test('uses the portrait destination branch scale', () => {
    expect(portraitDestinationFontSize('Accra')).toBe('8.4mm');
    expect(portraitDestinationFontSize('A destination branch')).toBe('6.6mm');
  });

  test('uses the landscape destination branch scale', () => {
    expect(landscapePrimaryFontSize('Accra')).toBe('5mm');
    expect(landscapePrimaryFontSize('A destination branch name')).toBe('4.1mm');
  });
});
