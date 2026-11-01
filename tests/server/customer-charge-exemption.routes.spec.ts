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

describe('receiving staff lookup authentication', () => {
  test.each([
    '/v1/shipments/bookings/receiving-staff-options',
    '/v1/self-service/receiving-staff-options',
  ])('%s is registered and cannot be read without authentication', async (path) => {
    expect(app.routes.some((route) => route.path === path && route.method === 'GET')).toBe(true);
    const response = await app.handle(
      new Request(`http://localhost${path}?destinationId=destination`),
    );
    expect(response.status).toBe(401);
  });
});
