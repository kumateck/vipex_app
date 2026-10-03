import { describe, expect, test } from 'bun:test';
import {
  portraitDestinationFontSize,
  portraitLocationFontSize,
  portraitReceiverNameFontSize,
} from './thermal-sticker-font-size.utils';

describe('portrait sticker font sizes', () => {
  test('caps the receiver name at 5mm and steps down for longer names', () => {
    expect(portraitReceiverNameFontSize('ADU EVANS')).toBe('5mm');
    expect(portraitReceiverNameFontSize('ABIGAIL AGYEKUM')).toBe('4.4mm');
    expect(portraitReceiverNameFontSize('JOSEMARIAM ABENA APPIAH')).toBe('3.8mm');
    expect(portraitReceiverNameFontSize('JOSEMARIAM ABENA APPIAH MENSAH')).toBe('3.2mm');
  });

  test('keeps two-word locations and long destinations from overflowing their rows', () => {
    expect(portraitLocationFontSize('Asafo')).toBe('4.2mm');
    expect(portraitLocationFontSize('Anloga Junction')).toBe('3.6mm');
    expect(portraitLocationFontSize('Tech Junction Area Two')).toBe('3.1mm');
    expect(portraitDestinationFontSize('Kumasi')).toBe('7.6mm');
    expect(portraitDestinationFontSize('Accra Circle VIP Terminal')).toBe('5mm');
  });
});
