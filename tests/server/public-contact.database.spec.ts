import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { closeSql, db, sql } from '@/db/config';
import { websiteContactEvents, websiteContactMessages } from '@/db/schemas';
import { createPublicContactService } from '@/server/features/public-contact/service';
import {
  getWebsiteContactRepo,
  isWebsiteContactEnabledRepo,
  listWebsiteContactsRepo,
  saveWebsiteContactRepo,
  updateWebsiteContactRepo,
} from '@/server/features/public-contact/repository';

const input = {
  type: 'complaint' as const,
  name: 'Ama Owusu',
  phone: '0204353512',
  message: 'Please help me find my parcel.',
  branch: 'accra-circle',
  trackingCode: 'TEST123',
  submissionId: '40686911-453e-40b1-87c2-5c35be55d773',
};
const submit = (companyId = 'company-a') =>
  createPublicContactService({
    companyId: () => companyId,
    isEnabled: isWebsiteContactEnabledRepo,
    save: saveWebsiteContactRepo,
  });
const first = async () => (await db.select().from(websiteContactMessages))[0]!;

describe.skipIf(process.env.WEBSITE_CONTACT_DB_TEST !== '1')(
  'isolated customer inbox persistence',
  () => {
    let ready = false;
    beforeAll(async () => {
      const url = new URL(process.env.TEST_DATABASE_URL!);
      if (
        !['127.0.0.1', 'localhost'].includes(url.hostname) ||
        url.pathname !== '/vipex_website_contact_test'
      ) {
        throw new Error('Requires the dedicated local vipex_website_contact_test database');
      }
      const [row] =
        await sql`SELECT count(*)::int AS total FROM information_schema.tables WHERE table_schema = 'public'`;
      if (row?.total !== 0) throw new Error('Customer inbox test database must be empty');
      await sql.unsafe(`CREATE TABLE companies (id varchar(25) PRIMARY KEY, is_deleted boolean NOT NULL DEFAULT false);
      CREATE TABLE users (id varchar(25) PRIMARY KEY);
      CREATE TABLE cs_tickets (id text PRIMARY KEY);
      CREATE TABLE it_support_tickets (id text PRIMARY KEY);
      INSERT INTO companies(id) VALUES ('company-a'), ('company-b');
      INSERT INTO companies(id,is_deleted) VALUES ('deleted-company',true);
      INSERT INTO users(id) VALUES ('staff-a');
      INSERT INTO cs_tickets VALUES ('original-cs');
      INSERT INTO it_support_tickets VALUES ('original-it');`);
      await sql.unsafe(await Bun.file('drizzle/0086_customer_website_messages.sql').text());
      ready = true;
    });
    beforeEach(async () => {
      await sql.unsafe('TRUNCATE website_contact_message_events, website_contact_messages');
    });
    afterAll(async () => {
      if (ready)
        await sql.unsafe(
          'DROP TABLE website_contact_message_events, website_contact_messages, cs_tickets, it_support_tickets, users, companies',
        );
      await closeSql();
    });

    test('stores separate customer records and leaves both internal ticket systems untouched', async () => {
      const { reference } = await submit()(input);
      const message = await first();
      expect(message).toMatchObject({
        reference,
        type: 'complaint',
        status: 'new',
        name: 'Ama Owusu',
        updatedBy: null,
      });
      expect(await db.select().from(websiteContactEvents)).toHaveLength(1);
      expect(Array.from(await sql`SELECT * FROM cs_tickets`)).toEqual([
        expect.objectContaining({ id: 'original-cs' }),
      ]);
      expect(Array.from(await sql`SELECT * FROM it_support_tickets`)).toEqual([
        expect.objectContaining({ id: 'original-it' }),
      ]);
    });

    test('concurrent retries create one message and one initial event', async () => {
      const results = await Promise.all(Array.from({ length: 5 }, () => submit()(input)));
      expect(new Set(results.map((result) => result.reference)).size).toBe(1);
      expect(await db.select().from(websiteContactMessages)).toHaveLength(1);
      expect(await db.select().from(websiteContactEvents)).toHaveLength(1);
      await expect(
        submit()({ ...input, message: 'A different customer message.' }),
      ).rejects.toMatchObject({ status: 409 });
    });

    test('all staff list/detail/update operations remain company scoped', async () => {
      const result = await submit()(input);
      const message = await first();
      expect((await submit('company-b')(input)).reference).not.toBe(result.reference);
      expect(
        (
          await listWebsiteContactsRepo({
            companyId: 'company-a',
            type: 'complaint',
            status: 'new',
            pageSize: 1,
          })
        ).total,
      ).toBe(1);
      expect(
        (await listWebsiteContactsRepo({ companyId: 'company-a', type: 'feedback' })).items,
      ).toHaveLength(0);
      await expect(getWebsiteContactRepo('company-b', message.id)).rejects.toMatchObject({
        status: 404,
      });
      await expect(
        updateWebsiteContactRepo({
          companyId: 'company-b',
          id: message.id,
          userId: 'staff-a',
          status: 'resolved',
          updatedAt: message.updatedAt.toISOString(),
        }),
      ).rejects.toMatchObject({ status: 404 });
    });

    test('records status and internal notes atomically and prevents stale overwrites', async () => {
      await submit()(input);
      const message = await first();
      const update = {
        companyId: 'company-a',
        id: message.id,
        userId: 'staff-a',
        status: 'in_progress' as const,
        note: 'Called the customer.',
        updatedAt: message.updatedAt.toISOString(),
      };
      await updateWebsiteContactRepo(update);
      const detail = await getWebsiteContactRepo('company-a', message.id);
      expect(detail.status).toBe('in_progress');
      expect(detail.events).toHaveLength(2);
      expect(detail.events).toContainEqual(
        expect.objectContaining({
          performedBy: 'staff-a',
          fromStatus: 'new',
          toStatus: 'in_progress',
          note: 'Called the customer.',
        }),
      );
      await expect(
        updateWebsiteContactRepo({ ...update, status: 'resolved' }),
      ).rejects.toMatchObject({ status: 409 });
      expect((await getWebsiteContactRepo('company-a', message.id)).status).toBe('in_progress');
    });

    test('rolls back the customer record if its history cannot be saved', async () => {
      await sql.unsafe(
        `ALTER TABLE website_contact_message_events ADD CONSTRAINT test_reject_event CHECK (to_status <> 'new')`,
      );
      try {
        await expect(submit()(input)).rejects.toThrow();
        expect(await db.select().from(websiteContactMessages)).toHaveLength(0);
      } finally {
        await sql.unsafe(
          'ALTER TABLE website_contact_message_events DROP CONSTRAINT test_reject_event',
        );
      }
    });

    test('rejects deleted and unknown destination companies', async () => {
      await expect(submit('deleted-company')(input)).rejects.toMatchObject({ status: 503 });
      await expect(submit('unknown-company')(input)).rejects.toMatchObject({ status: 503 });
      expect(await db.select().from(websiteContactMessages)).toHaveLength(0);
    });
  },
);
