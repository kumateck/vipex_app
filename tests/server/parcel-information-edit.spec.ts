import { PermissionKeys } from '@/shared/permissions/constants';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db, sql, closeSql } from '@/db/config';
import { customers, parcels, auditLogs } from '@/db/schemas';
import { editParcelInformationSvc } from '@/server/features/shipments/parcel-information-edit.service';
import { updateCustomerSvc } from '@/server/features/customers/service';
import { createParcelInformationEditFixture } from '../utils/parcel-information-edit-fixture';

const context = {
  id: 'parcel-a',
  companyId: 'company-a',
  branchId: 'branch-a',
  actorUserId: 'actor',
};
const edit = (fullname = 'Corrected Receiver') =>
  editParcelInformationSvc({ ...context, receiver: { id: 'receiver', fullname } });
const parcelRows = () => db.select().from(parcels).orderBy(parcels.id);
const receiver = async () =>
  (await db.select().from(customers).where(eq(customers.id, 'receiver')))[0]!;

describe.skipIf(!process.env.PARCEL_INFORMATION_EDIT_TEST)(
  'parcel edits and recorded history',
  () => {
    let fixture: Awaited<ReturnType<typeof createParcelInformationEditFixture>>;
    beforeAll(async () => {
      fixture = await createParcelInformationEditFixture();
    });
    beforeEach(async () => {
      await fixture.reset();
    });
    afterAll(async () => {
      if (fixture) await fixture.cleanup();
      await closeSql();
    });

    test('corrects the selected parcel and customer while preserving all other recorded names and financial fields', async () => {
      const before = await parcelRows();
      await edit();
      const after = await parcelRows();
      expect((await receiver()).fullname).toBe('Corrected Receiver');
      expect(after[0]!.receiverNameSnapshot).toBe('Corrected Receiver');
      expect(after[1]).toEqual(before[1]);
      expect(after[0]!.senderNameSnapshot).toBe('Sender');
      expect(after[0]!.secondReceiverNameSnapshot).toBe('Second Receiver');
      expect(after[0]!.receiverId).toBe('receiver');
      expect(after[0]!.chargePsw).toBe(5000);
      expect(after[0]!.status).toBe(before[0]!.status);
      expect(await db.select().from(auditLogs)).toHaveLength(2);
    });

    test('source branch corrects details, receiver snapshot and telephone atomically', async () => {
      const before = await parcelRows();
      await editParcelInformationSvc({
        ...context,
        branchId: 'source',
        actorPermissions: [PermissionKeys.CanUpdateParcels, PermissionKeys.CanUpdateCustomers],
        parcelDetails: 'Source corrected box',
        receiver: { id: 'receiver', fullname: 'Source corrected name', telephone: '0200000010' },
      });
      const after = await parcelRows();
      expect(after[0]!.parcelDetails).toBe('Source corrected box');
      expect(after[0]!.receiverNameSnapshot).toBe('Source corrected name');
      expect((await receiver()).telephone).toBe('0200000010');
      expect(after[0]!.receiverId).toBe(before[0]!.receiverId);
      expect(after[0]!.status).toBe(before[0]!.status);
      expect(after[0]!.chargePsw).toBe(before[0]!.chargePsw);
      expect(after[1]).toEqual(before[1]);
      const audits = await db.select().from(auditLogs);
      expect(audits).toHaveLength(2);
      const parcelAudit = audits.find((row) => row.entityType === 'parcel');
      expect((parcelAudit?.metadata as { patch?: object })?.patch).not.toHaveProperty(
        'actorPermissions',
      );
    });
    test('source branch read-only workflow grants do not authorize outgoing edits', async () => {
      await expect(
        editParcelInformationSvc({
          ...context,
          branchId: 'source',
          actorPermissions: [PermissionKeys.CanReadParcelIncoming],
          parcelDetails: 'Denied',
        }),
      ).rejects.toThrow('Parcel not found');
    });
    test('a third branch remains outside scope even with update permission', async () => {
      await expect(
        editParcelInformationSvc({
          ...context,
          branchId: 'other-branch',
          actorPermissions: [PermissionKeys.CanUpdateParcels],
          parcelDetails: 'Denied',
        }),
      ).rejects.toThrow('Parcel not found');
    });
    test.each(['default', 'crm'] as const)(
      'a customer management rename in %s context leaves parcel history untouched',
      async (sourceContext) => {
        const before = await parcelRows();
        await updateCustomerSvc(
          'receiver',
          'company-a',
          { fullname: 'Profile Name', sourceContext },
          'actor',
        );
        expect((await receiver()).fullname).toBe('Profile Name');
        expect(await parcelRows()).toEqual(before);
      },
    );

    test('phone-only edit preserves a newer customer profile name and both parcel snapshots', async () => {
      await updateCustomerSvc('receiver', 'company-a', { fullname: 'Profile Name' }, 'actor');
      await editParcelInformationSvc({
        ...context,
        receiver: { id: 'receiver', telephone: '0200000001' },
      });
      expect((await receiver()).fullname).toBe('Profile Name');
      expect((await receiver()).telephone).toBe('0200000001');
      expect((await parcelRows()).map((p) => p.receiverNameSnapshot)).toEqual([
        'Original Receiver',
        'Original Receiver',
      ]);
    });

    test('later unrelated parcel writes retain the corrected name after a profile rename', async () => {
      await edit();
      await updateCustomerSvc('receiver', 'company-a', { fullname: 'Profile Name' }, 'actor');
      await db.update(parcels).set({ parcelContent: 'Books' }).where(eq(parcels.id, 'parcel-a'));
      expect((await parcelRows())[0]!.receiverNameSnapshot).toBe('Corrected Receiver');
    });

    test('an older database trigger rejects and rolls back the entire correction', async () => {
      const old = await Bun.file('drizzle/0073_parcel_customer_name_snapshots.sql').text();
      const start = old.indexOf('CREATE OR REPLACE FUNCTION');
      await sql.unsafe(old.slice(start, old.indexOf('--> statement-breakpoint', start)));
      try {
        await expect(
          editParcelInformationSvc({
            ...context,
            parcelDetails: 'Corrected details',
            receiver: { id: 'receiver', fullname: 'Corrected Receiver' },
          }),
        ).rejects.toThrow('correction could not be saved');
        expect((await receiver()).fullname).toBe('Original Receiver');
        expect((await parcelRows())[0]!.receiverNameSnapshot).toBe('Original Receiver');
        expect((await parcelRows())[0]!.parcelDetails).toBe('Box');
        expect(await db.select().from(auditLogs)).toHaveLength(0);
      } finally {
        await sql.unsafe(
          await Bun.file('drizzle/0081_parcel_receiver_name_corrections.sql').text(),
        );
      }
    });

    test.each([{ branchId: 'other-branch' }, { companyId: 'other-company' }])(
      'rejects a parcel outside authenticated scope: %j',
      async (scope) => {
        await expect(
          editParcelInformationSvc({
            ...context,
            ...scope,
            receiver: { id: 'receiver', fullname: 'New' },
          }),
        ).rejects.toThrow('Parcel not found');
        expect((await receiver()).fullname).toBe('Original Receiver');
      },
    );

    test('rejects stale receiver association and deleted parcel', async () => {
      await expect(
        editParcelInformationSvc({ ...context, receiver: { id: 'other', fullname: 'New' } }),
      ).rejects.toThrow('receiver changed');
      await db.update(parcels).set({ isDeleted: true }).where(eq(parcels.id, context.id));
      await expect(edit()).rejects.toThrow('Parcel not found');
    });

    test.each(['0500000001', '0500000002'])(
      'duplicate primary/secondary phone rejects the entire edit: %s',
      async (telephone) => {
        await expect(
          editParcelInformationSvc({
            ...context,
            parcelDetails: 'Large Box',
            receiver: { id: 'receiver', fullname: 'New', telephone },
          }),
        ).rejects.toThrow('telephone already exists');
        expect((await receiver()).fullname).toBe('Original Receiver');
        expect((await parcelRows())[0]!.parcelDetails).toBe('Box');
        expect(await db.select().from(auditLogs)).toHaveLength(0);
      },
    );

    test('parcel write failure rolls back the customer and audits', async () => {
      await sql.unsafe(
        "ALTER TABLE parcels ADD CONSTRAINT reject_test_details CHECK (parcel_details <> 'reject')",
      );
      try {
        await expect(
          editParcelInformationSvc({
            ...context,
            parcelDetails: 'reject',
            receiver: { id: 'receiver', fullname: 'New' },
          }),
        ).rejects.toThrow();
        expect((await receiver()).fullname).toBe('Original Receiver');
        expect((await parcelRows())[0]!.receiverNameSnapshot).toBe('Original Receiver');
        expect(await db.select().from(auditLogs)).toHaveLength(0);
      } finally {
        await sql.unsafe('ALTER TABLE parcels DROP CONSTRAINT reject_test_details');
      }
    });

    test.each([' ', 'x'.repeat(256)])('rejects an invalid receiver name', async (name) => {
      await expect(edit(name)).rejects.toThrow('Receiver name');
    });

    test('changing receiver ID still captures the replacement name; migration can be reapplied', async () => {
      await sql.unsafe(await Bun.file('drizzle/0081_parcel_receiver_name_corrections.sql').text());
      await db.update(parcels).set({ receiverId: 'duplicate' }).where(eq(parcels.id, context.id));
      expect((await parcelRows())[0]!.receiverNameSnapshot).toBe('Duplicate');
    });
  },
);
