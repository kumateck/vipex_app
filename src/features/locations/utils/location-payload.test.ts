import { describe, expect, test } from 'bun:test';
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
  test('renaming does not implicitly restore disabled services', () => {
    expect(toUpdateLocationPayload({ name: 'New name' })).toEqual({ name: 'New name' });
    expect(
      toUpdateLocationPayload({ name: 'New name', canSend: false, canReceive: false }),
    ).toEqual({ name: 'New name', canSend: false, canReceive: false });
  });
});
