import { describe, expect, test } from 'bun:test';
import { resolveSunyaniAccraRoute, type PickupLocation } from './sunyani-accra-pickup-location';

const branches = [
  { id: 'sunyani', name: 'Sunyani', company_id: 'company' },
  { id: 'accra', name: ' Accra ', company_id: 'company' },
  { id: 'other-accra', name: 'Accra', company_id: 'other' },
];
const oldLocation: PickupLocation = {
  id: 'old',
  name: 'Circle Kumasi office',
  branch_id: 'accra',
  company_id: 'company',
  can_receive: false,
  is_deleted: false,
};
const newLocation: PickupLocation = {
  ...oldLocation,
  id: 'new',
  name: 'Circle Sunyani Old Office',
  can_receive: true,
};

describe('Sunyani to Accra pickup move scope', () => {
  test('resolves the named route and locations within one company', () => {
    expect(
      resolveSunyaniAccraRoute('company', branches, [
        oldLocation,
        { ...newLocation, name: ' CIRCLE SUNYANI OLD OFFICE ' },
        { ...newLocation, id: 'different', branch_id: 'sunyani' },
        { ...newLocation, id: 'foreign', company_id: 'other' },
      ]),
    ).toMatchObject({
      source: { id: 'sunyani' },
      destination: { id: 'accra' },
      from: { id: 'old' },
      to: { id: 'new' },
    });
  });

  test('rejects missing, disabled, deleted and ambiguous destinations', () => {
    for (const options of [
      [],
      [{ ...newLocation, can_receive: false }],
      [{ ...newLocation, is_deleted: true }],
      [newLocation, { ...newLocation, id: 'duplicate' }],
    ]) {
      expect(() =>
        resolveSunyaniAccraRoute('company', branches, [oldLocation, ...options]),
      ).toThrow('active receiving location named Circle Sunyani Old Office in Accra');
    }
  });

  test('requires the old Accra location and a Sunyani branch in the same company', () => {
    expect(() => resolveSunyaniAccraRoute('company', branches, [newLocation])).toThrow(
      'Circle Kumasi office location in Accra',
    );
    expect(() =>
      resolveSunyaniAccraRoute('company', branches.slice(1), [oldLocation, newLocation]),
    ).toThrow('active Sunyani branch in the selected company');
  });
});
