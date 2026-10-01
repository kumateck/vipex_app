import { Elysia, t } from 'elysia';
import { getPublicParcelTrackingSvc } from './public-tracking.service';

const trackingParams = t.Object({ trackingCode: t.String({ minLength: 1, maxLength: 255 }) });

async function track({ params }: { params: { trackingCode: string } }) {
  return getPublicParcelTrackingSvc(params.trackingCode);
}

export const publicTrackingRoutes = new Elysia({ name: 'public-tracking' })
  .get('/public/tracking/:trackingCode', track, {
    params: trackingParams,
    detail: { tags: ['Public tracking'], summary: 'Track a parcel by tracking code' },
  })
  .get('/public/bookings/:trackingCode/tracker', track, {
    params: trackingParams,
    detail: { tags: ['Public tracking'], summary: 'Legacy public tracking alias' },
  })
  .get('/api/v1/bookings/:trackingCode/tracker', track, {
    params: trackingParams,
    detail: { tags: ['Public tracking'], summary: 'Legacy application-compatible tracking URL' },
  });
