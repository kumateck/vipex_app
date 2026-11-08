import { describe, expect, test } from 'bun:test';
import { planMissingParcelLocations, type LocationRepairLocation } from './parcel-location-repair';

const companyId = 'company';
const branch = { id: 'branch', name: 'Accra', company_id: companyId };
const location: LocationRepairLocation = {
  id: 'circle',
  name: 'Circle',
  branch_id: branch.id,
  company_id: companyId,
  can_receive: true,
  is_deleted: false,
};
const plan = (locations: LocationRepairLocation[]) =>
  planMissingParcelLocations(companyId, [branch], locations);

describe('missing destination pickup location repair policy', () => {
  test('uses the sole active receiver and excludes deleted, sending-only, other-branch and other-company locations', () => {
    const result = plan([
      location,
      { ...location, id: 'deleted', is_deleted: true },
      { ...location, id: 'sending', can_receive: false },
      { ...location, id: 'other-branch', branch_id: 'other' },
      { ...location, id: 'other-company', company_id: 'other' },
    ]);
    expect(result[0]?.locationId).toBe('circle');
  });
  test('rejects ambiguous branches and branches with no receiver', () => {
    expect(() => plan([location, { ...location, id: 'second' }])).toThrow('found 2');
    expect(() => plan([])).toThrow('found 0');
  });
  test('Kumasi uses the specified Anloga Junction ID even with multiple receiving locations', () => {
    const result = planMissingParcelLocations(
      companyId,
      [{ ...branch, name: 'Kumasi' }],
      [
        { ...location, id: 'suame', name: 'Suame' },
        { ...location, id: 'anloga', name: 'Anloga Junction' },
      ],
      'anloga',
    );
    expect(result[0]?.locationId).toBe('anloga');
  });
  test('rejects a wrong or disabled Anloga ID instead of choosing another receiver', () => {
    for (const item of [
      location,
      { ...location, id: 'anloga', name: 'Anloga Junction', can_receive: false },
    ])
      expect(() =>
        planMissingParcelLocations(companyId, [{ ...branch, name: 'Kumasi' }], [item], 'anloga'),
      ).toThrow('unavailable');
  });
  test('rejects cross-company branches', () => {
    expect(() => planMissingParcelLocations('other', [branch], [location])).toThrow(
      'another company',
    );
  });
  test('an already repaired company has an empty plan', () => {
    expect(planMissingParcelLocations(companyId, [], [])).toEqual([]);
  });
});
