import { eq, and, desc, inArray } from 'drizzle-orm';
import { db } from '../../../db/client';
import { consignments, consignmentItems, parcels } from '../../../db/schemas/shipments';
import { PaymentResponsibility } from '../../../db/schemas/enums';

export interface AutoGroupingInput {
  sourceBranchId: string;
  companyId?: string;
  minParcelCount?: number;
  maxWaitMinutes?: number;
  forceCreate?: boolean;
}

/**
 * Simple auto-grouping implementation
 */
export async function autoGroupParcels(input: AutoGroupingInput): Promise<{
  createdConsignments: string[];
  groupedParcels: number;
  remainingParcels: number;
}> {
  const {
    sourceBranchId,
    companyId,
    minParcelCount = 5,
    maxWaitMinutes = 120,
    forceCreate = false,
  } = input;

  // Get all parcels from source branch
  const allParcels = await db
    .select({
      id: parcels.id,
      trackingCode: parcels.trackingCode,
      destinationId: parcels.destinationId,
      parcelValuePsw: parcels.parcelValuePsw,
      createdAt: parcels.createdAt,
      companyId: parcels.companyId,
    })
    .from(parcels)
    .where(eq(parcels.sourceId, sourceBranchId))
    .orderBy(parcels.createdAt)
    .limit(200);

  // Group by destination
  const destinationGroups = new Map<string, any[]>();

  for (const parcel of allParcels) {
    const destination = parcel.destinationId;
    if (!destinationGroups.has(destination)) {
      destinationGroups.set(destination, []);
    }
    destinationGroups.get(destination)?.push(parcel);
  }

  // Create consignments for groups meeting criteria
  const createdConsignments: string[] = [];
  let groupedParcels = 0;

  for (const [destination, group] of destinationGroups) {
    if (group.length >= minParcelCount && (forceCreate || group.length >= 10)) {
      const consignment = await createConsignment({
        companyId: companyId || group[0].companyId,
        sourceBranchId,
        destinationBranchId: destination,
        parcelIds: group.map((p: any) => p.id),
        createdBy: 'system-auto-group',
      });

      createdConsignments.push(consignment.id);
      groupedParcels += group.length;
    }
  }

  return {
    createdConsignments,
    groupedParcels,
    remainingParcels: allParcels.length - groupedParcels,
  };
}

/**
 * Create consignment from parcel IDs
 */
async function createConsignment(input: {
  companyId: string;
  sourceBranchId: string;
  destinationBranchId: string;
  parcelIds: string[];
  createdBy: string;
}) {
  const { companyId, sourceBranchId, destinationBranchId, parcelIds, createdBy } = input;

  // Get consignment date and serial
  const consignmentDate = new Date();
  const serialForDay = 1; // Simplified - just increment
  const consignmentCode = generateConsignmentCode(consignmentDate, serialForDay);

  return await db.transaction(async (tx: any) => {
    // Create consignment
    const [consignment] = await tx
      .insert(consignments)
      .values({
        companyId,
        sourceId: sourceBranchId,
        destinationId: destinationBranchId,
        consignmentDate: consignmentDate.toISOString().split('T')[0],
        serialForDay,
        code: consignmentCode,
        createdBy,
      })
      .returning();

    // Add parcels to consignment
    for (const parcelId of parcelIds) {
      await tx.insert(consignmentItems).values({
        consignmentId: consignment.id,
        parcelId,
      });
    }

    return consignment;
  });
}

/**
 * Generate consignment code
 */
function generateConsignmentCode(date: Date, serial: number): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const serialStr = serial.toString().padStart(3, '0');
  return `C${dateStr}${serialStr}`;
}
