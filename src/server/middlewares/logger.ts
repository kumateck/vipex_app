import { Elysia } from 'elysia';
import { logger as devLogger } from '../utils/logger';

export const logger = new Elysia({ name: 'logger' })
  .derive(() => ({ _start: performance.now() }))
  .onAfterHandle(({ request, _start, response }) => {
    const url = new URL(request.url);
    if (url.pathname === '/health') return;

    const rid = request.headers.get('x-request-id') ?? undefined;
    const ms = Number((performance.now() - _start).toFixed(1));
    const status = (response as Response | undefined)?.status ?? 0;

    devLogger.info(
      JSON.stringify({
        t: new Date().toISOString(),
        rid,
        method: request.method,
        path: url.pathname,
        status,
        ms,
      }),
    );
  });
