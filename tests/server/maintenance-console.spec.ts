import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { closeSql, db, sql } from '@/db/config';
import { roles, users } from '@/db/schemas';
import { UserStatus } from '@/db/schemas/enums';
import { createIsolatedSchemaFixture } from '../utils/isolated-schema-fixture';
import {
  executeMaintenanceRunSvc,
  getMaintenanceRunsSvc,
  getMaintenanceScriptsSvc,
} from '@/server/features/maintenance/service';
import { maintenanceRoutes } from '@/server/features/maintenance';
import { errorHandler } from '@/server/middlewares/error-handler';
import { signAccessToken } from '@/server/utils/jwt';
import type { AuthUser } from '@/server/plugins/auth';
import type { MaintenanceRunRequest } from '@/shared/maintenance';

const enabled = process.env.MAINTENANCE_CONSOLE_TEST === '1';
describe.skipIf(!enabled)('System Admin maintenance console on isolated PostgreSQL', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedSchemaFixture>>;
  const admin: AuthUser = {
    sub: 'admin',
    email: 'admin@example.test',
    companyId: 'company',
    roleId: 'admin-role',
  };
  const repair: MaintenanceRunRequest = {
    operationId: 'repair-credit-print-payment',
    params: { bookingCode: 'BOOK-CREDIT' },
    mode: 'preview',
  };
  const app = new Elysia()
    .use(errorHandler)
    .group('/v1/maintenance', (routes) => routes.use(maintenanceRoutes));
  const preview = () => executeMaintenanceRunSvc(admin, repair);
  const apply = (id: string) =>
    executeMaintenanceRunSvc(admin, {
      ...repair,
      mode: 'execute',
      previewRunId: id,
      confirmNoCashReceived: true,
    });
  beforeAll(async () => {
    fixture = await createIsolatedSchemaFixture('vipex_maintenance_test');
    await db.insert(roles).values([
      { id: 'admin-role', companyId: 'company', name: 'System Admin', createdBy: 'admin' },
      { id: 'staff-role', companyId: 'company', name: 'Accounts', createdBy: 'admin' },
      { id: 'foreign-role', companyId: 'other', name: 'System Admin', createdBy: 'admin' },
    ]);
    await db.insert(users).values(
      ['admin', 'second-admin', 'staff'].map((id) => ({
        id,
        companyId: 'company',
        branchId: 'source',
        roleId: id === 'staff' ? 'staff-role' : 'admin-role',
        fullname: id,
        email: `${id}@example.test`,
        telephone: '0200000000',
        createdBy: 'admin',
        status: UserStatus.ACTIVE,
      })),
    );
  });
  beforeEach(async () => {
    await sql`truncate parcels, payments, customer_credit_transactions, customer_credit_allocations, tax_journal_items, tax_filing_audit_logs, journal_entries, daily_cash_confirmations, audit_logs`;
    await sql`update users set status = ${UserStatus.ACTIVE}, role_id = case when id = 'staff' then 'staff-role' else 'admin-role' end`;
    await sql`update roles set is_deleted = false`;
    await sql.unsafe(`
      insert into parcels (id,company_id,source_id,destination_id,booking_id,booking_code,tracking_code,sender_id,receiver_id,method,status,charge_psw,planned_tobepaid_psw,parcel_details,parcel_content)
        values ('parcel','company','source','destination','booking','BOOK-CREDIT','TRACK-CREDIT','sender','receiver',4,5,5000,0,'Box','Clothes');
      insert into payments (id,parcel_id,company_id,branch_id,cashier_user_id,component,payer,cashier_type,method,gross_amount_psw,net_amount_psw,vat_psw,getfund_psw,nhil_psw,covid_psw,tax_total_psw,received_at)
        values ('payment','parcel','company','source','admin',0,0,0,0,5000,4167,625,104,104,0,833,'2026-10-24 19:00:40');
      insert into customer_credit_transactions (id,company_id,customer_id,source_type,transaction_type,reference_id,signed_amount_psw,created_by)
        values ('credit','company','sender',0,0,'parcel',5000,'admin');
      insert into tax_journal_items (id,company_id,branch_id,source_type,source_id,filing_status,tax_base_psw,tax_total_psw)
        values ('tax','company','source',7,'payment',0,5000,833);
    `);
  });
  afterAll(async () => {
    await fixture?.cleanup();
    await closeSql();
  });

  test('catalog and API deny unauthenticated users and non-admin roles', async () => {
    expect((await app.handle(new Request('http://localhost/v1/maintenance/scripts'))).status).toBe(
      401,
    );
    for (const action of [getMaintenanceScriptsSvc, getMaintenanceRunsSvc]) {
      await expect(
        action({
          ...admin,
          sub: 'staff',
          permissions: ['CanManageCompanyModules', 'CanSetUserPassword'],
        }),
      ).rejects.toMatchObject({ status: 403 });
    }
    await expect(
      executeMaintenanceRunSvc({ ...admin, sub: 'staff' }, repair),
    ).rejects.toMatchObject({ status: 403 });
    expect(await sql`select id from audit_logs`).toHaveLength(0);
  });
  test.each([
    ['revoked role', `update users set role_id = 'staff-role' where id = 'admin'`],
    ['disabled user', `update users set status = 1 where id = 'admin'`],
    ['foreign company role', `update users set role_id = 'foreign-role' where id = 'admin'`],
    ['deleted role', `update roles set is_deleted = true where id = 'admin-role'`],
  ])('fresh database checks reject a %s despite old token claims', async (_name, change) => {
    await sql.unsafe(change);
    await expect(getMaintenanceScriptsSvc(admin)).rejects.toMatchObject({ status: 403 });
  });
  test('catalog is reachable by an authenticated live System Admin', async () => {
    const token = await signAccessToken({ sub: 'admin' });
    const response = await app.handle(
      new Request('http://localhost/v1/maintenance/scripts', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).length).toBe(10);
  });
  test('preview and run use the same guarded repair and record the logged-in admin', async () => {
    const reviewed = await preview();
    expect(reviewed.result?.readyToApply).toBe(true);
    expect((await sql`select voided_at from payments`)[0]!.voided_at).toBeNull();
    const completed = await apply(reviewed.id);
    expect(completed.result?.summary).toContain('Voided GHS 50.00');
    expect((await sql`select voided_by from payments`)[0]!.voided_by).toBe('admin');
    expect((await sql`select filing_status from tax_journal_items`)[0]!.filing_status).toBe(3);
    expect(
      (await sql`select signed_amount_psw from customer_credit_transactions`)[0]!.signed_amount_psw,
    ).toBe('5000');
    expect((await sql`select status from parcels`)[0]!.status).toBe(5);
    const history = await getMaintenanceRunsSvc(admin);
    expect(history).toHaveLength(2);
    expect(history.every((run) => run.status === 'succeeded' && run.actorName === 'admin')).toBe(
      true,
    );
    await expect(apply(reviewed.id)).rejects.toMatchObject({ status: 409 });
  });
  test('execution requires a successful preview, same admin and no-cash confirmation', async () => {
    await expect(
      executeMaintenanceRunSvc(admin, { ...repair, mode: 'execute' }),
    ).rejects.toMatchObject({ status: 400 });
    const reviewed = await preview();
    await expect(
      executeMaintenanceRunSvc(
        { ...admin, sub: 'second-admin' },
        { ...repair, mode: 'execute', previewRunId: reviewed.id, confirmNoCashReceived: true },
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect((await sql`select voided_at from payments`)[0]!.voided_at).toBeNull();
  });
  test('changed records and expired previews cannot be executed', async () => {
    const reviewed = await preview();
    await sql`update payments set id = 'replacement-payment'`;
    await sql`update tax_journal_items set source_id = 'replacement-payment'`;
    await expect(apply(reviewed.id)).rejects.toMatchObject({ status: 409 });
    const fresh = await preview();
    await sql`update audit_logs set metadata = jsonb_set(metadata::jsonb, '{run,completedAt}', to_jsonb('2000-01-01T00:00:00Z'::text))::json where id = ${fresh.id}`;
    await expect(apply(fresh.id)).rejects.toMatchObject({ status: 409 });
    expect((await sql`select voided_at from payments`)[0]!.voided_at).toBeNull();
  });
  test('parameter injection and unsupported scripts are refused', async () => {
    await expect(
      executeMaintenanceRunSvc(admin, {
        ...repair,
        params: { ...repair.params, companyId: 'other' },
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      executeMaintenanceRunSvc(admin, {
        ...repair,
        params: { bookingCode: 'BOOK; DROP TABLE parcels' },
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      executeMaintenanceRunSvc(admin, {
        ...repair,
        operationId: 'reset_remote_db' as MaintenanceRunRequest['operationId'],
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
  test('inspections are company scoped and appear in run history', async () => {
    const trace = await executeMaintenanceRunSvc(admin, {
      operationId: 'trace-credit-parcel',
      params: { bookingCode: 'BOOK-CREDIT' },
      mode: 'preview',
    });
    expect(trace.result?.summary).toContain('Found 1');
    const scan = await executeMaintenanceRunSvc(admin, {
      operationId: 'scan-credit-conflicts',
      params: {},
      mode: 'preview',
    });
    expect(scan.result?.summary).toContain('Found 1');
    await expect(
      executeMaintenanceRunSvc({ ...admin, companyId: 'other' }, repair),
    ).rejects.toMatchObject({ status: 403 });
    await sql`update parcels set company_id = 'other'`;
    await expect(preview()).rejects.toMatchObject({ status: 400 });
  });
  test('audit update failure rolls back payment, tax and credit repair together', async () => {
    const reviewed = await preview();
    await sql.unsafe(
      `alter table audit_logs add constraint block_maintenance_success check (action <> 'MAINTENANCE_RUN_SUCCEEDED') not valid`,
    );
    try {
      await expect(apply(reviewed.id)).rejects.toMatchObject({ status: 400 });
      expect((await sql`select voided_at from payments`)[0]!.voided_at).toBeNull();
      expect((await sql`select filing_status from tax_journal_items`)[0]!.filing_status).toBe(0);
      expect(await sql`select id from tax_filing_audit_logs`).toHaveLength(0);
    } finally {
      await sql.unsafe('alter table audit_logs drop constraint block_maintenance_success');
    }
  });
});
