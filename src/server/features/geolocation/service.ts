import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches } from '@/db/schemas';
import { getCacheStore } from '@/server/services/cache';

type DistanceResult = {
  meters: number;
  kilometers: number;
};

type NearbyBranch = {
  id: string;
  name: string;
  companyId: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
};

type NearbyArgs = {
  latitude: number;
  longitude: number;
  radiusKm: number;
  companyId?: string | null;
  limit?: number;
};

const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function calculateDistanceMeters(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

export function calculateDistance(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): DistanceResult {
  const meters = calculateDistanceMeters(fromLat, fromLng, toLat, toLng);
  return {
    meters,
    kilometers: Number((meters / 1000).toFixed(3)),
  };
}

export async function findNearbyBranches(args: NearbyArgs): Promise<NearbyBranch[]> {
  const max = Math.min(Math.max(args.limit ?? 20, 1), 100);
  const radiusMeters = args.radiusKm * 1000;
  const key = `geo:nearby:${args.companyId ?? 'all'}:${args.latitude}:${args.longitude}:${args.radiusKm}:${max}`;
  const cache = getCacheStore();
  const cached = await cache.get(key);
  if (cached) return JSON.parse(cached) as NearbyBranch[];

  const baseWhere = args.companyId
    ? and(eq(branches.companyId, args.companyId), isNotNull(branches.latitude), isNotNull(branches.longitude))
    : and(isNotNull(branches.latitude), isNotNull(branches.longitude));

  const distanceExpr = sql<number>`ST_DistanceSphere(
    ST_MakePoint(${args.longitude}, ${args.latitude}),
    ST_MakePoint(${branches.longitude}, ${branches.latitude})
  )`;

  const where = and(baseWhere, sql`${distanceExpr} <= ${radiusMeters}`);

  const rows = await db
    .select({
      id: branches.id,
      name: branches.name,
      companyId: branches.companyId,
      latitude: branches.latitude,
      longitude: branches.longitude,
      distanceMeters: distanceExpr,
    })
    .from(branches)
    .where(where)
    .orderBy(sql`${distanceExpr} asc`)
    .limit(max);

  const result: NearbyBranch[] = rows
    .filter((row) => row.latitude !== null && row.longitude !== null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      companyId: row.companyId,
      latitude: row.latitude as number,
      longitude: row.longitude as number,
      distanceMeters: Math.round(row.distanceMeters),
    }));

  await cache.set(key, JSON.stringify(result), { ttlSeconds: 30 });
  return result;
}
