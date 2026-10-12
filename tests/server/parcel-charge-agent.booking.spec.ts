import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { closeSql, db, sql } from '@/db/config';
import {
  auditLogs,
  bookings,
  parcels,
  payments,
  selfServiceBookingDrafts,
  ParcelStatus,
  PaymentMethod,
  SelfServiceDraftStatus,
} from '@/db/schemas';
import {
  createBookingWithParcelsSvc,
  type CreateBookingWithParcelsBody,
} from '@/server/features/shipments/booking-with-parcels.service';
import { completeSelfServiceDraftSvc } from '@/server/features/self-service/drafts.service';
import { listParcelChargeAgentOptionsSvc } from '@/server/features/shipments/parcel-charge-agents.service';
import { createChargeAgentBookingFixture } from '../utils/charge-agent-booking-fixture';
import { assertParcelChargeAgentsRepo } from '@/server/features/shipments/parcel-charge-agents.repository';

const enabled = Boolean(process.env.CHARGE_AGENT_BOOKING_TEST);
const user = {
  sub: 'creator',
  email: 'creator@test.local',
  companyId: 'company-a',
  branchId: 'branch-a',
  branchType: 1,
};

function booking(agentIds: Array<string | null | undefined>): CreateBookingWithParcelsBody {
  return {
    senderId: 'sender',
    companyId: 'company-a',
    sourceId: 'branch-a',
    status: ParcelStatus.CREATED,
    createdBy: 'creator',
    requireActiveCashierSession: false,
    parcels: agentIds.map((chargeAgentUserId) => ({
      destinationId: 'branch-b',
      receiverId: 'receiver',
      status: ParcelStatus.CREATED,
      parcelDetails: 'One box',
      parcelContent: 'Clothes',
      chargeCedis: 30,
      plannedToBePaidCedis: 0,
      method: PaymentMethod.CASH,
      senderPaymentCedis: 0,
      cashierUserId: 'creator',
      branchId: 'branch-a',
      chargeAgentUserId,
    })),
  };
}

describe.skipIf(!enabled)('charge-agent booking persistence', () => {
  let fixture: Awaited<ReturnType<typeof createChargeAgentBookingFixture>>;
  beforeAll(async () => {
    fixture = await createChargeAgentBookingFixture();
  });
  beforeEach(async () => {
    await fixture.clearBookings();
  });
  afterAll(async () => {
    await fixture?.cleanup();
    await closeSql();
  });

  test('lists only active agents at the authenticated company and source branch', async () => {
    const agents = await listParcelChargeAgentOptionsSvc(user);
    expect(agents.map((agent) => agent.id)).toEqual(['agent-a', 'agent-b', 'creator']);
    expect(Object.keys(agents[0]!)).toEqual(['id', 'fullname']);
  });

  test('saves different selected agents per parcel and preserves creator, charge and payment handoff', async () => {
    const created = await createBookingWithParcelsSvc(booking(['agent-a', 'agent-b']));
    for (const [index, reference] of created.parcels.entries()) {
      const [parcel] = await db.select().from(parcels).where(eq(parcels.id, reference.id));
      expect(parcel).toMatchObject({
        chargeAgentUserId: `agent-${index === 0 ? 'a' : 'b'}`,
        createdBy: 'creator',
        processedBy: null,
        chargePsw: 3000,
        plannedToBePaidPsw: 0,
        status: ParcelStatus.CREATED,
      });
    }
    expect(await db.select().from(payments)).toHaveLength(0);
    const [audit] = await db.select().from(auditLogs);
    expect(audit?.metadata).toMatchObject({ chargeAgentUserIds: ['agent-a', 'agent-b'] });
  });

  test.each(['unknown', 'other-branch', 'other-company', 'inactive'])(
    'rejects %s without partial booking, parcel or payment records',
    async (id) => {
      const input = booking(['agent-a', id]);
      input.parcels[0]!.senderPaymentCedis = 30;
      await expect(createBookingWithParcelsSvc(input)).rejects.toThrow(
        'Parcel 2: Select an active charge agent',
      );
      expect(await db.select().from(bookings)).toHaveLength(0);
      expect(await db.select().from(parcels)).toHaveLength(0);
      expect(await db.select().from(payments)).toHaveLength(0);
    },
  );

  test('older clients without selection create parcels with NULL attribution', async () => {
    await createBookingWithParcelsSvc(booking([undefined, null]));
    expect((await db.select().from(parcels)).map((parcel) => parcel.chargeAgentUserId)).toEqual([
      null,
      null,
    ]);
  });

  test('collecting sender payment keeps the selected agent separate from the payment cashier', async () => {
    const input = booking(['agent-b']);
    input.parcels[0]!.senderPaymentCedis = 30;
    const created = await createBookingWithParcelsSvc(input);
    expect(created.payments).toHaveLength(1);
    const [parcel] = await db.select().from(parcels);
    const [payment] = await db.select().from(payments);
    expect(parcel?.chargeAgentUserId).toBe('agent-b');
    expect(payment).toMatchObject({
      cashierUserId: 'creator',
      parcelId: parcel!.id,
      grossAmountPsw: 3000,
    });
  });

  test('selected staff status cannot change while the booking transaction holds its validation lock', async () => {
    await db.transaction(async (tx) => {
      await assertParcelChargeAgentsRepo(booking(['agent-a']), tx);
      await expect(
        sql.begin(async (other) => {
          await other.unsafe("SET LOCAL lock_timeout = '100ms'");
          await other.unsafe("UPDATE users SET status = 4 WHERE id = 'agent-a'");
        }),
      ).rejects.toThrow('lock timeout');
    });
  });

  test('self-service completion saves the selected agent independently of the completing officer', async () => {
    const draft = await fixture.draft();
    const result = await completeSelfServiceDraftSvc(
      draft.id,
      {
        destinationId: 'branch-b',
        parcelDetails: 'One box',
        chargeCedis: 30,
        paymentResponsibility: 'RECEIVER',
        senderSettlementMode: 'PAY_NOW',
        chargeAgentUserId: 'agent-b',
      },
      user,
    );
    const [parcel] = await db.select().from(parcels).where(eq(parcels.id, result.parcels[0]!.id));
    expect(parcel).toMatchObject({
      chargeAgentUserId: 'agent-b',
      createdBy: 'creator',
      processedBy: null,
      chargePsw: 3000,
      plannedToBePaidPsw: 3000,
      callSender: true,
    });
    const [after] = await db
      .select()
      .from(selfServiceBookingDrafts)
      .where(eq(selfServiceBookingDrafts.id, draft.id));
    expect(after).toMatchObject({
      status: SelfServiceDraftStatus.COMPLETED,
      completedBy: 'creator',
      parcelId: parcel!.id,
    });
  });

  test('an ineligible self-service selection leaves the draft available and creates no parcel', async () => {
    const draft = await fixture.draft();
    await expect(
      completeSelfServiceDraftSvc(
        draft.id,
        {
          destinationId: 'branch-b',
          parcelDetails: 'One box',
          chargeCedis: 30,
          paymentResponsibility: 'SENDER',
          senderSettlementMode: 'PAY_NOW',
          chargeAgentUserId: 'other-company',
        },
        user,
      ),
    ).rejects.toThrow('Select an active charge agent');
    const [after] = await db
      .select()
      .from(selfServiceBookingDrafts)
      .where(eq(selfServiceBookingDrafts.id, draft.id));
    expect(after?.status).toBe(SelfServiceDraftStatus.PENDING);
    expect(after?.parcelId).toBeNull();
    expect(await db.select().from(bookings)).toHaveLength(0);
    expect(await db.select().from(parcels)).toHaveLength(0);
  });
});
