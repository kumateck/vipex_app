import { describe, expect, test } from 'bun:test';
import { createLocationSchema } from '../schemas/location-form.schema';
import { toCreateLocationPayload, toUpdateLocationPayload } from './location-payload';

describe('location capability form payloads', () => {
  test('new locations retain both services unless explicitly disabled', () => {
    const context = { companyId: 'company', createdBy: 'actor' };
    expect(
      toCreateLocationPayload({ name: ' Location ', branchId: 'branch' }, context),
    ).toMatchObject({ name: 'Location', canSend: true, canReceive: true });
    expect(
      toCreateLocationPayload({ name: 'Location', branchId: 'branch', canReceive: false }, context),
    ).toMatchObject({ canSend: true, canReceive: false });
  });
  test('preserves telephone strings, trims values and clears explicit blanks without clearing omitted values', () => {
    const context = { companyId: 'company', createdBy: 'actor' };
    expect(
      toCreateLocationPayload(
        { name: 'Desk', branchId: 'branch', telephone: ' 0300000001 ' },
        context,
      ),
    ).toMatchObject({ telephone: '0300000001' });
    expect(toUpdateLocationPayload({ name: 'Desk', telephone: '' })).toEqual({
      name: 'Desk',
      telephone: null,
    });
    expect(toUpdateLocationPayload({ name: 'Desk' })).not.toHaveProperty('telephone');
    expect(
      createLocationSchema.safeParse({
        name: 'Desk',
        branchId: 'branch',
        telephone: '1'.repeat(31),
        canSend: true,
        canReceive: true,
      }).success,
    ).toBe(false);
  });
  test('renaming does not implicitly restore disabled services', () => {
    expect(toUpdateLocationPayload({ name: 'New name' })).toEqual({ name: 'New name' });
    expect(
      toUpdateLocationPayload({ name: 'New name', canSend: false, canReceive: false }),
    ).toEqual({ name: 'New name', canSend: false, canReceive: false });
  });
});
