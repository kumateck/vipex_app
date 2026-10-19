import { describe, expect, test } from 'bun:test';
import { resolveCustomerByTelephone } from './resolve-customer-by-telephone';

describe('second receiver customer resolution', () => {
  test('links an existing customer without creating or changing it', async () => {
    let createCount = 0;
    const result = await resolveCustomerByTelephone({
      findExisting: async () => ({ id: 'existing-customer' }),
      create: async () => {
        createCount += 1;
        return { id: 'new-customer' };
      },
    });
    expect(result.id).toBe('existing-customer');
    expect(createCount).toBe(0);
  });

  test('creates a customer only when no exact match exists', async () => {
    const result = await resolveCustomerByTelephone({
      findExisting: async () => null,
      create: async () => ({ id: 'new-customer' }),
    });
    expect(result.id).toBe('new-customer');
  });

  test('links a record created concurrently after an initial miss', async () => {
    let lookupCount = 0;
    const result = await resolveCustomerByTelephone({
      findExisting: async () => (++lookupCount === 1 ? null : { id: 'concurrent-customer' }),
      create: async () => {
        throw new Error('duplicate telephone');
      },
    });
    expect(result.id).toBe('concurrent-customer');
    expect(lookupCount).toBe(2);
  });
});
