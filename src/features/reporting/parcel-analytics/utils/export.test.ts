import { describe, expect, test } from 'bun:test';
import { buildParcelAnalyticsReport } from '@/server/features/reporting/parcel-analytics/aggregation';
import { csvCell } from './format';
import { parcelAnalyticsCsv } from './export';

describe('parcel analytics CSV', () => {
  test('escapes CSV and prevents formula execution from branch names', () => {
    expect(csvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"');
    expect(csvCell('Branch "A"')).toBe('"Branch ""A"""');
    expect(csvCell('Accra, Central')).toBe('"Accra, Central"');
  });
  test('exports applied scope, all statuses and zero days without fabricated amounts', () => {
    const report = buildParcelAnalyticsReport(
      [],
      { companyId: 'company', from: '2026-10-01', to: '2026-10-02', basis: 'destination' },
      [],
      0,
    );
    const csv = parcelAnalyticsCsv(report);
    expect(csv).toContain('"Branch basis","destination"');
    expect(csv).toContain('"Created","0","0.0","0.00","0.00"');
    expect(csv).toContain('"2026-10-02","0"');
    expect(csv).not.toContain('NaN');
  });
});
