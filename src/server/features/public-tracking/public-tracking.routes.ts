import { Elysia, t } from 'elysia';
import { getPublicParcelTrackingSvc } from './public-tracking.service';

const trackingParams = t.Object({ trackingCode: t.String({ minLength: 1, maxLength: 255 }) });

async function track({ params }: { params: { trackingCode: string } }) {
  return getPublicParcelTrackingSvc(params.trackingCode);
}

export const publicTrackingRoutes = new Elysia({ name: 'public-tracking' }).get(
  '/v1/public/tracking/:trackingCode',
  track,
  {
    params: trackingParams,
    detail: { tags: ['Public tracking'], summary: 'Track a parcel by tracking code' },
  },
);
