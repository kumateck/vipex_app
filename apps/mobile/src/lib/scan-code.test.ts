import { describe, expect, it } from 'bun:test';
import { extractScannedCode } from './scan-code';

describe('extractScannedCode', () => {
  it('preserves bare parcel codes', () => {
    expect(extractScannedCode('  A1234567ABC  ')).toBe('A1234567ABC');
  });

  it('extracts codes from current parcel tracking URLs', () => {
    expect(extractScannedCode('https://vipexparcel.com/tracking/A1234567ABC?source=qr')).toBe(
      'A1234567ABC',
    );
  });

  it('accepts legacy production QR-prefixed payloads', () => {
    expect(extractScannedCode('QR-A1234567ABC')).toBe('A1234567ABC');
    expect(extractScannedCode('https://vipexparcel.com/tracking/QR-A1234567ABC')).toBe(
      'A1234567ABC',
    );
  });

  it('does not strip non-QR code prefixes', () => {
    expect(extractScannedCode('TRK-A1234567ABC')).toBe('TRK-A1234567ABC');
  });
});
