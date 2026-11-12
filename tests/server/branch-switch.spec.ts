import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '@/db/config';
import { auditLogs, branches, locations, rolePermissions, users } from '@/db/schemas';
import { BranchType } from '@/db/schemas/enums';
import { authRoutes } from '@/server/features/auth/routes';
import { errorHandler } from '@/server/middlewares/error-handler';
import { hashPassword } from '@/server/utils/password';
import type { BranchSwitchChoice } from '@/shared/auth/branch-switch';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

const app = new Elysia().use(errorHandler).use(authRoutes);
const password = 'branch-switch-test-pass';
let home: Awaited<ReturnType<typeof createShelfPickupFixture>>;
let foreign: typeof home;
const target = createId();
const targetLocation = createId();
const headOffice = createId();
const deletedBranch = createId();

beforeAll(async () => {
  home = await createShelfPickupFixture();
  foreign = await createShelfPickupFixture();
  const { companyId, actor } = home;
  await db
    .update(users)
    .set({ password: await hashPassword(password) })
    .where(eq(users.id, actor));
  await db.insert(branches).values([
    { id: target, name: target, companyId, createdBy: actor },
    { id: headOffice, name: headOffice, type: BranchType.HEADOFFICE, companyId, createdBy: actor },
    { id: deletedBranch, name: deletedBranch, isDeleted: true, companyId, createdBy: actor },
  ]);
  await db.insert(locations).values({
    id: targetLocation,
    branchId: target,
    companyId,
    name: targetLocation,
    createdBy: actor,
  });
});

afterAll(async () => {
  if (home) await home.cleanup();
  if (foreign) await foreign.cleanup();
});

function request(path: string, body?: unknown, token?: string) {
  return app.handle(
    new Request(`http://localhost/auth/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}

type Session = {
  tokens: { accessToken: string; refreshToken: string };
  user: { branch: { id: string }; location: { id: string } | null };
};

async function login(): Promise<Session> {
  const response = await request('login', { email: `${home.actor}@example.test`, password });
  expect(response.status).toBe(200);
  return response.json();
}

function refresh(session: Session, switchBranch?: BranchSwitchChoice) {
  return request('refresh', { refreshToken: session.tokens.refreshToken, switchBranch });
}

function profile(session: Session) {
  return request('me/profile', undefined, session.tokens.accessToken);
}

test('switching changes only the selected sign-in and requires a current branch grant', async () => {
  const original = await login();
  const choice = { branchId: target, locationId: targetLocation };
  expect((await request('me/branch-options', undefined, original.tokens.accessToken)).status).toBe(
    403,
  );
  expect((await refresh(original, choice)).status).toBe(403);

  await db.insert(rolePermissions).values({
    roleId: home.roleId,
    companyId: home.companyId,
    permission: PermissionKeys.CanSwitchBranch,
  });
  const options = await request('me/branch-options', undefined, original.tokens.accessToken);
  expect(options.status).toBe(200);
  const available = await options.json();
  expect(available.current).toEqual({ branchId: home.branchId, locationId: home.locationId });
  expect(available.branches.map(({ id }: { id: string }) => id).sort()).toEqual(
    [home.branchId, target].sort(),
  );

  for (const branchId of [foreign.branchId, headOffice, deletedBranch]) {
    expect((await refresh(original, { branchId, locationId: null })).status).toBe(404);
  }
  expect((await refresh(original, { branchId: target, locationId: home.locationId })).status).toBe(
    400,
  );

  const attempts = await Promise.all([refresh(original, choice), refresh(original, choice)]);
  expect(attempts.map(({ status }) => status).sort()).toEqual([200, 401]);
  const switched = (await attempts.find(({ ok }) => ok)!.json()) as Session;
  expect(switched.user).toMatchObject({ branch: { id: target }, location: { id: targetLocation } });
  expect((await profile(original)).status).toBe(401);
  const activeProfile = await profile(switched);
  expect(activeProfile.status).toBe(200);
  expect(await activeProfile.json()).toMatchObject({
    branch: { id: target },
    locationId: targetLocation,
  });

  const renewedResponse = await refresh(switched);
  expect(renewedResponse.status).toBe(200);
  const renewed = (await renewedResponse.json()) as Session;
  expect(renewed.user).toMatchObject(switched.user);
  const independent = await login();
  expect(independent.user.branch.id).toBe(home.branchId);
  const returnedResponse = await refresh(renewed, {
    branchId: home.branchId,
    locationId: home.locationId,
  });
  expect(returnedResponse.status).toBe(200);
  const returned = (await returnedResponse.json()) as Session;
  expect(returned.user).toMatchObject({
    branch: { id: home.branchId },
    location: { id: home.locationId },
  });
  const [account] = await db.select().from(users).where(eq(users.id, home.actor));
  expect(account).toMatchObject({ branchId: home.branchId, locationId: home.locationId });

  const events = await db
    .select()
    .from(auditLogs)
    .where(
      and(eq(auditLogs.actorUserId, home.actor), eq(auditLogs.action, 'AUTH_BRANCH_SWITCHED')),
    );
  expect(events).toHaveLength(2);
  expect(events.map(({ metadata }) => metadata)).toContainEqual({
    fromBranchId: home.branchId,
    fromLocationId: home.locationId,
    ...choice,
  });

  const revokedScopeResponse = await refresh(independent, choice);
  expect(revokedScopeResponse.status).toBe(200);
  const revokedScope = (await revokedScopeResponse.json()) as Session;
  await db
    .delete(rolePermissions)
    .where(
      and(
        eq(rolePermissions.roleId, home.roleId),
        eq(rolePermissions.permission, PermissionKeys.CanSwitchBranch),
      ),
    );
  expect((await profile(revokedScope)).status).toBe(401);
  expect((await refresh(revokedScope)).status).toBe(401);
});
