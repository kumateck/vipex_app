import { Elysia, t } from 'elysia';
import { findNearbyBranches, calculateDistance } from './service';
import { UUID } from '../../schemas/common';

const Latitude = t.Number({ minimum: -90, maximum: 90 });
const Longitude = t.Number({ minimum: -180, maximum: 180 });

export const geolocationRoutes = new Elysia({ name: 'geolocation' })
  .get(
    '/distance',
    async ({ query }) => {
      return calculateDistance(query.fromLat, query.fromLng, query.toLat, query.toLng);
    },
    {
      query: t.Object({
        fromLat: Latitude,
        fromLng: Longitude,
        toLat: Latitude,
        toLng: Longitude,
      }),
      detail: {
        tags: ['Geolocation'],
        summary: 'Calculate distance between two coordinates',
        operationId: 'calculateGeoDistance',
      },
    },
  )
  .get(
    '/branches/nearby',
    async ({ query }) =>
      findNearbyBranches({
        latitude: query.latitude,
        longitude: query.longitude,
        radiusKm: query.radiusKm,
        companyId: query.companyId ?? null,
        limit: query.limit,
      }),
    {
      query: t.Object({
        latitude: Latitude,
        longitude: Longitude,
        radiusKm: t.Number({ minimum: 0.1, maximum: 2000 }),
        companyId: t.Optional(UUID),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      }),
      detail: {
        tags: ['Geolocation'],
        summary: 'Find nearby branches using PostGIS distance filtering',
        operationId: 'findNearbyBranches',
      },
    },
  );
