import { describe, expect, test } from 'bun:test';
import { validateExistingCustomerEdit } from '../../src/features/operations/parcel/utils/existing-customer-edit';

describe('validateExistingCustomerEdit', () => {
  test('accepts a name with no secondary telephone', () => {
    expect(
      validateExistingCustomerEdit({ fullname: 'Jane Doe', telephone2: '' }, '0249667429'),
    ).toBeNull();
  });

  test('accepts a different ten-digit secondary telephone', () => {
    expect(
      validateExistingCustomerEdit(
        { fullname: 'Jane Doe', telephone2: '0500000129' },
        '0249667429',
      ),
    ).toBeNull();
  });

  test('rejects a missing customer name', () => {
    expect(validateExistingCustomerEdit({ fullname: ' ', telephone2: '' }, '0249667429')).toBe(
      'Customer name is required',
    );
  });

  test('rejects an incomplete secondary telephone', () => {
    expect(
      validateExistingCustomerEdit({ fullname: 'Jane Doe', telephone2: '0500' }, '0249667429'),
    ).toBe('Telephone 2 must be exactly 10 digits');
  });

  test('rejects a secondary telephone matching the primary telephone', () => {
    expect(
      validateExistingCustomerEdit(
        { fullname: 'Jane Doe', telephone2: '0249667429' },
        '0249667429',
      ),
    ).toBe('Primary and secondary telephone cannot be the same');
  });
});
