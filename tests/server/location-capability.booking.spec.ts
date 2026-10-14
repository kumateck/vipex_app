import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { locations } from '@/db/schemas';
import { assertBookingLocationCapabilitiesRepo } from '@/server/features/locations';
import { listLocationOptionsRepo } from '@/server/features/locations/repository';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

describe('booking location service validation', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
  });
  afterAll(async () => {
    await fixture?.cleanup();
  });
  const validate = () =>
    db.transaction((tx) =>
      assertBookingLocationCapabilitiesRepo(
        {
          companyId: fixture.companyId,
          sourceId: fixture.branchId,
          sourceLocationId: fixture.locationId,
          parcels: [{ destinationId: fixture.branchId, pickupLocationId: fixture.locationId }],
        },
        tx,
      ),
    );
  test('existing locations default to sending and receiving', async () => {
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, fixture.locationId));
    expect(location).toMatchObject({ canSend: true, canReceive: true });
    await validate();
  });
  test('sending-only locations disappear from receiving options but remain in unfiltered administrative options', async () => {
    await db
      .update(locations)
      .set({ canReceive: false })
      .where(eq(locations.id, fixture.locationId));
    expect(
      await listLocationOptionsRepo({
        companyId: fixture.companyId,
        branchId: fixture.branchId,
        canReceive: true,
      }),
    ).toHaveLength(0);
    expect(
      await listLocationOptionsRepo({ companyId: fixture.companyId, branchId: fixture.branchId }),
    ).toHaveLength(1);
    await expect(validate()).rejects.toThrow('does not receive');
  });
  test('receiving-only locations cannot be assigned as a sending source', async () => {
    await db
      .update(locations)
      .set({ canReceive: true, canSend: false })
      .where(eq(locations.id, fixture.locationId));
    await expect(validate()).rejects.toThrow('does not send');
    await db.transaction((tx) =>
      assertBookingLocationCapabilitiesRepo(
        {
          companyId: fixture.companyId,
          sourceId: fixture.branchId,
          parcels: [{ destinationId: fixture.branchId, pickupLocationId: fixture.locationId }],
        },
        tx,
      ),
    );
  });
});
