import { describe, expect, test } from 'bun:test';
import { resolveBookingCustomer } from './resolve-booking-customer';

const person = {
  telephone: '0240000000',
  telephone2: '',
  fullname: 'Ama',
  customerId: '',
};

describe('mobile booking customer resolution', () => {
  test('reuses an existing customer without creating a duplicate', async () => {
    let created = false;
    const id = await resolveBookingCustomer(person, 'Sender', {
      find: async () => [{ id: 'existing', fullname: 'Ama', telephone: person.telephone }],
      create: async () => {
        created = true;
        return { id: 'new' };
      },
    });
    expect(id).toBe('existing');
    expect(created).toBe(false);
  });

  test('creates a customer when neither telephone matches', async () => {
    const id = await resolveBookingCustomer(person, 'Recipient', {
      find: async () => [],
      create: async () => ({ id: 'new' }),
    });
    expect(id).toBe('new');
  });

  test('recovers when another request creates the customer after lookup', async () => {
    let searches = 0;
    const id = await resolveBookingCustomer(person, 'Sender', {
      find: async () => (++searches === 1 ? [] : [{ id: 'concurrent', fullname: 'Ama' }]),
      create: async () => {
        throw new Error('duplicate');
      },
    });
    expect(id).toBe('concurrent');
  });

  test('rejects phone numbers belonging to different customers', async () => {
    await expect(
      resolveBookingCustomer({ ...person, telephone2: '0550000000' }, 'Sender', {
        find: async (telephone) => [{ id: telephone, fullname: 'Different' }],
        create: async () => ({ id: 'new' }),
      }),
    ).rejects.toThrow('different customers');
  });

  test('requires a choice when a phone belongs to multiple customers', async () => {
    const deps = {
      find: async () => [
        { id: 'first', fullname: 'First' },
        { id: 'second', fullname: 'Second' },
      ],
      create: async () => ({ id: 'new' }),
    };
    await expect(resolveBookingCustomer(person, 'Sender', deps)).rejects.toThrow(
      'Select the matching',
    );
    expect(await resolveBookingCustomer({ ...person, customerId: 'second' }, 'Sender', deps)).toBe(
      'second',
    );
  });
});
