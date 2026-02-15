import { db } from '@/db/config';
import { autoGroupParcels } from './auto-grouping.service';
import type { AutoGroupingInput } from './auto-grouping.service';
import { parcels } from '@/db/schemas';
import { eq } from 'drizzle-orm';

export async function autoGroupingController(input: AutoGroupingInput) {
  const result = await autoGroupParcels(input);

  return {
    success: true,
    result,
    message: `Auto-grouping completed. Created ${result.createdConsignments.length} consignments with ${result.groupedParcels} parcels.`,
  };
}

export async function getGroupingStatusController(branchId: string) {
  // Get parcels awaiting grouping
  const allParcels = await db
    .select({
      id: parcels.id,
      trackingCode: parcels.trackingCode,
      destinationId: parcels.destinationId,
      createdAt: parcels.createdAt,
    })
    .from(parcels)
    .where(eq(parcels.sourceId, branchId))
    .orderBy(parcels.createdAt)
    .limit(100);

  const eligibleCount = allParcels.length;
  const averageWaitTime = eligibleCount > 0 ? calculateAverageWaitTime(allParcels) : '0 hours';

  const urgencyLevel = getUrgencyLevel(eligibleCount);
  const suggestedAction = getSuggestedAction(eligibleCount);

  return {
    success: true,
    status: {
      eligibleParcels: eligibleCount,
      averageWaitTime,
      urgencyLevel,
      suggestedAction,
      destinations: getDestinationBreakdown(allParcels),
    },
  };
}

function calculateAverageWaitTime(parcels: any[]): string {
  if (parcels.length === 0) return '0 hours';

  const now = Date.now();
  const totalWait = parcels.reduce((sum, p) => {
    const wait = now - new Date(p.createdAt).getTime();
    return sum + wait;
  }, 0);

  const avgWaitMinutes = Math.round(totalWait / parcels.length / (60 * 1000));
  const hours = Math.floor(avgWaitMinutes / 60);
  const minutes = avgWaitMinutes % 60;

  return `${hours}h ${minutes}m`;
}

function getUrgencyLevel(parcelCount: number): string {
  if (parcelCount >= 50) return 'HIGH';
  if (parcelCount >= 20) return 'MEDIUM';
  if (parcelCount >= 10) return 'LOW';
  return 'MINIMAL';
}

function getSuggestedAction(parcelCount: number): string {
  if (parcelCount >= 50) return 'IMMEDIATE AUTO-GROUPING REQUIRED';
  if (parcelCount >= 20) return 'SCHEDULE AUTO-GROUPING SOON';
  if (parcelCount >= 10) return 'CONSIDER AUTO-GROUPING';
  return 'MONITOR PENDING PARCELS';
}

function getDestinationBreakdown(parcels: any[]): any[] {
  const destinationCounts = new Map();

  for (const parcel of parcels) {
    const dest = parcel.destinationId;
    destinationCounts.set(dest, (destinationCounts.get(dest) || 0) + 1);
  }

  return Array.from(destinationCounts.entries()).map(([dest, count]) => ({
    destinationId: dest,
    parcelCount: count,
  }));
}
