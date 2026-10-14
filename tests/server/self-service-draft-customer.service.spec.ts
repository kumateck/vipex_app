import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers, selfServiceBookingDrafts } from '@/db/schemas';
import { SelfServiceDraftStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { updateSelfServiceDraftCustomersSvc } from '@/server/features/self-service/draft-customer.service';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

const sender = { fullname: 'Submitted Sender', phone: '0240000000', phone2: null };
const receiver = { fullname: 'Submitted Receiver', phone: '0240000001', phone2: null };
describe('self-service draft customer corrections', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
  });
  afterAll(async () => {
    if (!fixture) return;
    await db
      .delete(selfServiceBookingDrafts)
      .where(eq(selfServiceBookingDrafts.companyId, fixture.companyId));
    await fixture.cleanup();
  });
  const actor = (permissions: string[] = []) => ({
    sub: fixture.actor,
    email: 'officer@example.test',
    companyId: fixture.companyId,
    branchId: fixture.branchId,
    permissions,
  });
  const draft = async (patch = {}) => {
    const [row] = await db
      .insert(selfServiceBookingDrafts)
      .values({
        companyId: fixture.companyId,
        branchId: fixture.branchId,
        senderFullname: sender.fullname,
        senderPhone: sender.phone,
        receiverFullname: receiver.fullname,
        receiverPhone: receiver.phone,
        parcelContent: 'Books',
        expiresAt: new Date(Date.now() + 3600000),
        ...patch,
      })
      .returning();
    return row!;
  };
  test('new customer declarations can be corrected without changing saved profiles', async () => {
    const row = await draft();
    const result = await updateSelfServiceDraftCustomersSvc(
      row.id,
      {
        sender: { ...sender, fullname: 'Corrected Sender' },
        receiver,
        expectedUpdatedAt: row.updatedAt.toISOString(),
      },
      actor(),
    );
    expect(result.senderFullname).toBe('Corrected Sender');
    expect(result.senderCustomerId).toBeNull();
    expect(result.status).toBe(SelfServiceDraftStatus.PENDING);
  });
  test('editing a saved customer requires customer permission and rolls back the draft on denial', async () => {
    const [customer] = await db
      .insert(customers)
      .values({
        companyId: fixture.companyId,
        fullname: receiver.fullname,
        telephone: receiver.phone,
        createdBy: fixture.actor,
      })
      .returning();
    const row = await draft({ receiverCustomerId: customer!.id });
    const input = {
      sender: { ...sender, fullname: 'Changed sender' },
      receiver: { ...receiver, fullname: 'Corrected Receiver' },
      expectedUpdatedAt: row.updatedAt.toISOString(),
    };
    await expect(updateSelfServiceDraftCustomersSvc(row.id, input, actor())).rejects.toThrow(
      'Customer update permission',
    );
    const [unchanged] = await db
      .select()
      .from(selfServiceBookingDrafts)
      .where(eq(selfServiceBookingDrafts.id, row.id));
    expect(unchanged?.senderFullname).toBe(sender.fullname);
    const updated = await updateSelfServiceDraftCustomersSvc(
      row.id,
      input,
      actor([PermissionKeys.CanUpdateCustomers]),
    );
    expect(updated.receiverCustomerId).toBe(customer!.id);
    const [savedCustomer] = await db.select().from(customers).where(eq(customers.id, customer!.id));
    expect(savedCustomer?.fullname).toBe('Corrected Receiver');
  });
  test('changing a primary phone detaches the old customer instead of overwriting their profile', async () => {
    const [customer] = await db
      .insert(customers)
      .values({
        companyId: fixture.companyId,
        fullname: 'Old Sender',
        telephone: '0240000020',
        createdBy: fixture.actor,
      })
      .returning();
    const row = await draft({
      senderCustomerId: customer!.id,
      senderFullname: 'Old Sender',
      senderPhone: '0240000020',
    });
    const result = await updateSelfServiceDraftCustomersSvc(
      row.id,
      {
        sender: { ...sender, phone: '0240000021' },
        receiver,
        expectedUpdatedAt: row.updatedAt.toISOString(),
      },
      actor(),
    );
    expect(result.senderCustomerId).toBeNull();
    const [old] = await db.select().from(customers).where(eq(customers.id, customer!.id));
    expect(old?.telephone).toBe('0240000020');
  });
  test('stale versions, foreign branches, other officers claims and completed drafts reject corrections', async () => {
    const row = await draft();
    const input = { sender, receiver, expectedUpdatedAt: row.updatedAt.toISOString() };
    await expect(
      updateSelfServiceDraftCustomersSvc(
        row.id,
        { ...input, expectedUpdatedAt: new Date(0).toISOString() },
        actor(),
      ),
    ).rejects.toThrow('changed');
    await expect(
      updateSelfServiceDraftCustomersSvc(row.id, input, { ...actor(), branchId: 'other' }),
    ).rejects.toThrow('not found');
    const claimed = await draft({
      status: SelfServiceDraftStatus.CLAIMED,
      claimedBy: fixture.oldPicker,
    });
    await expect(
      updateSelfServiceDraftCustomersSvc(
        claimed.id,
        { ...input, expectedUpdatedAt: claimed.updatedAt.toISOString() },
        actor(),
      ),
    ).rejects.toThrow('another officer');
    const completed = await draft({ status: SelfServiceDraftStatus.COMPLETED });
    await expect(
      updateSelfServiceDraftCustomersSvc(
        completed.id,
        { ...input, expectedUpdatedAt: completed.updatedAt.toISOString() },
        actor(),
      ),
    ).rejects.toThrow('pending or claimed');
  });
});
