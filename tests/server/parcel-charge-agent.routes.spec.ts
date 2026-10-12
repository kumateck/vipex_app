import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { HttpError } from '@/server/utils/http-error';
import { bookingWithParcelsRoutes } from '@/server/features/shipments/booking-with-parcels.routes';
import { selfServiceAgentRoutes } from '@/server/features/self-service/agent.routes';

const app = new Elysia()
  .onError(({ error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return { message: error.message };
    }
  })
  .group('/v1/shipments/bookings', (group) => group.use(bookingWithParcelsRoutes))
  .group('/v1/self-service', (group) => group.use(selfServiceAgentRoutes));

describe('parcel charge-agent option routes', () => {
  test.each([
    '/v1/shipments/bookings/charge-agent-options',
    '/v1/self-service/charge-agent-options',
  ])('registers %s and requires staff authentication', async (path) => {
    expect(app.routes.some((route) => route.path === path && route.method === 'GET')).toBe(true);
    const response = await app.handle(new Request(`http://localhost${path}`));
    expect(response.status).toBe(401);
  });
});
