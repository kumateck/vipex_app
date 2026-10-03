import { describe, expect, test } from 'bun:test';
import {
  landscapePrimaryFontSize,
  landscapeReceiverNameFontSize,
  portraitDestinationFontSize,
  portraitReceiverNameFontSize,
} from '../../src/features/printing/components/templates/thermal-sticker-font-size.utils';

describe('thermal sticker receiver sizing', () => {
  test('uses the portrait destination branch scale', () => {
    expect(portraitDestinationFontSize('Accra')).toBe('7.6mm');
    expect(portraitDestinationFontSize('A destination branch')).toBe('5mm');
  });

  test('uses the landscape destination branch scale', () => {
    expect(landscapePrimaryFontSize('Accra')).toBe('5mm');
    expect(landscapePrimaryFontSize('A destination branch name')).toBe('4.1mm');
  });

  test('sizes portrait receiver names independently of the destination', () => {
    expect(portraitReceiverNameFontSize('Michael Agyenim')).toBe('4.4mm');
    expect(portraitReceiverNameFontSize('A receiver with a longer full name')).toBe('3.2mm');
  });

  test('sizes landscape receiver names independently of the destination', () => {
    expect(landscapeReceiverNameFontSize('Michael Agyenim')).toBe('6mm');
    expect(landscapeReceiverNameFontSize('A receiver with a longer full name')).toBe('3.9mm');
  });
});
