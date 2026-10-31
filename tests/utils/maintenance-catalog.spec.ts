import { describe, expect, test } from 'bun:test';
import { MAINTENANCE_SCRIPTS } from '@/shared/maintenance';
import { validateMaintenanceParams } from '@/server/features/maintenance/validation';

describe('complete booking-code maintenance catalog', () => {
  test('all ten operations are distinct and repairs have specific confirmations', () => {
    expect(MAINTENANCE_SCRIPTS).toHaveLength(10);
    expect(new Set(MAINTENANCE_SCRIPTS.map((script) => script.id)).size).toBe(10);
    for (const script of MAINTENANCE_SCRIPTS) {
      expect(script.fields.some((field) => field.name === 'bookingCode')).toBe(true);
      if (script.kind === 'repair') expect(script.confirmation?.length).toBeGreaterThan(10);
      expect(validateMaintenanceParams(script.id, { bookingCode: ' BOOK1 ' }).params).toEqual({
        bookingCode: 'BOOK1',
      });
    }
    expect(validateMaintenanceParams('scan-credit-conflicts', {}).params).toEqual({});
    expect(validateMaintenanceParams('scan-credit-conflicts', { bookingCode: ' ' }).params).toEqual(
      {},
    );
  });
  test('receiving workflow accepts an optional location without accepting extra parameters', () => {
    expect(
      validateMaintenanceParams('repair-parcel-receiving-workflow', {
        bookingCode: ' BOOK1 ',
        pickupLocationId: ' circle ',
      }).params,
    ).toEqual({ bookingCode: 'BOOK1', pickupLocationId: 'circle' });
    expect(() =>
      validateMaintenanceParams('repair-parcel-receiving-workflow', {
        bookingCode: 'BOOK1',
        status: '5',
      }),
    ).toThrow('Unsupported');
  });
  test('every eligible repository script has a runtime adapter and source references exist', async () => {
    const sources = new Set(MAINTENANCE_SCRIPTS.flatMap((script) => script.sourceFiles ?? []));
    for (const source of sources) expect(await Bun.file(source).exists()).toBe(true);
    for await (const path of new Bun.Glob('scripts/**/*.{ts,sql}').scan('.')) {
      const filename = path.split('/').at(-1)!;
      if (!/^(find|check|fix|repair|trace|backfill|inspect|run-repair)/.test(filename)) continue;
      const source = await Bun.file(path).text();
      if (/booking[_ -]?code/i.test(source) || filename === 'backfill-parcel-customer-names.ts')
        expect(sources.has(path)).toBe(true);
    }
  });
});
