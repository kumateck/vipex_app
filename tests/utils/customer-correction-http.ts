import { Elysia } from 'elysia';
import { db } from '@/db/config';
import { refreshTokens } from '@/db/schemas';
import { signAccessToken } from '@/server/utils/jwt';
import { customerCorrectionRoutes } from '@/server/features/shipments/customer-corrections';

export async function correctionHttpSession(permissions: string[]) {
  const [session] = await db
    .insert(refreshTokens)
    .values({
      userId: 'actor',
      tokenHash: 'local-test-only',
      expiresAt: new Date(Date.now() + 600000),
      permissionsSnapshot: permissions,
    })
    .returning({ id: refreshTokens.id });
  const token = await signAccessToken({
    sub: 'actor',
    sid: session!.id,
    email: 'actor@example.test',
    companyId: 'company',
    branchId: 'third-branch',
  });
  const app = new Elysia()
    .onError(({ error, set }) => {
      if ('status' in error && typeof error.status === 'number') set.status = error.status;
      return { message: error instanceof Error ? error.message : 'Request failed' };
    })
    .use(customerCorrectionRoutes);
  return (path: string, body?: unknown) =>
    app.handle(
      new Request(`http://localhost/customer-corrections${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
}
