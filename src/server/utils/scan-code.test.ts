import { describe, expect, it } from 'bun:test';
import { extractScannedCode } from './scan-code';

describe('server extractScannedCode', () => {
  it('normalizes current and legacy parcel QR payloads', () => {
    expect(extractScannedCode('https://vipexparcel.com/tracking/A1234567ABC')).toBe('A1234567ABC');
    expect(extractScannedCode('QR-A1234567ABC')).toBe('A1234567ABC');
    expect(extractScannedCode('https://vipexparcel.com/tracking/QR-A1234567ABC')).toBe(
      'A1234567ABC',
    );
  });
});
