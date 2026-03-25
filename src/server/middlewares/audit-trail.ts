import { Elysia } from 'elysia';
import { verifyAccessToken } from '@/server/utils/jwt';
import { recordAuditLog } from '@/server/features/audit/logger';

function statusFromResponse(response: unknown): number {
  if (response instanceof Response) return response.status;
  return 200;
}

function toQueryObject(url: URL): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    out[key] = value;
  }
  return out;
}

function deriveAuditTarget(pathname: string): {
  entityType: string;
  entityId: string | null;
} {
  const segments = pathname.split('/').filter(Boolean);
  const apiSegments = segments[0] === 'v1' ? segments.slice(1) : segments;

  if (!apiSegments.length) {
    return { entityType: 'api', entityId: null };
  }

  const entityType = apiSegments.slice(0, Math.min(2, apiSegments.length)).join('_').toLowerCase();
  const idPattern = /^[A-Za-z0-9_-]{12,25}$/;
  const entityId = [...apiSegments].reverse().find((segment) => idPattern.test(segment)) ?? null;

  return { entityType, entityId };
}

async function parseAuthContext(request: Request): Promise<{
  actorUserId?: string | null;
  companyId?: string | null;
}> {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return { actorUserId: null, companyId: null };

  const token = auth.slice('Bearer '.length).trim();
  if (!token) return { actorUserId: null, companyId: null };

  try {
    const payload = await verifyAccessToken(token);
    return {
      actorUserId: typeof payload.sub === 'string' ? payload.sub : null,
      companyId: typeof payload.companyId === 'string' ? payload.companyId : null,
    };
  } catch {
    return { actorUserId: null, companyId: null };
  }
}

export const auditTrail = new Elysia({ name: 'audit-trail' })
  .derive(() => ({ _auditStart: performance.now() }))
  .onAfterHandle(async ({ request, response, _auditStart }) => {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/v1')) return;

    const status = statusFromResponse(response);
    const durationMs = Number((performance.now() - _auditStart).toFixed(1));
    const method = request.method.toUpperCase();
    const target = deriveAuditTarget(url.pathname);

    const authContext = await parseAuthContext(request);
    if (!authContext.companyId) return;

    const action = `${target.entityType.toUpperCase()}_${method}`;

    await recordAuditLog({
      companyId: authContext.companyId,
      actorUserId: authContext.actorUserId ?? null,
      entityType: target.entityType,
      entityId: target.entityId,
      action,
      message: `${method} ${url.pathname} -> ${status}`,
      metadata: {
        method,
        path: url.pathname,
        query: toQueryObject(url),
        status,
        durationMs,
        requestId: request.headers.get('x-request-id') ?? null,
      },
    });
  });
