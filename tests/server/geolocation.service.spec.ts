import { describe, expect, test } from 'bun:test';
import { calculateDistance } from '../../src/server/features/geolocation/service';

describe('Geolocation distance service', () => {
  test('returns zero distance for same coordinate', () => {
    const result = calculateDistance(5.6037, -0.187, 5.6037, -0.187);
    expect(result.meters).toBe(0);
    expect(result.kilometers).toBe(0);
  });

  test('computes realistic distance for Accra to Kumasi', () => {
    const accra = { lat: 5.6037, lng: -0.187 };
    const kumasi = { lat: 6.6885, lng: -1.6244 };
    const result = calculateDistance(accra.lat, accra.lng, kumasi.lat, kumasi.lng);

    expect(result.meters).toBeGreaterThan(180000);
    expect(result.meters).toBeLessThan(260000);
    expect(result.kilometers).toBeGreaterThan(180);
    expect(result.kilometers).toBeLessThan(260);
  });
});
