import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { deliveries, parcels, payments } from '@/db/schemas';
import { PaymentComponent } from '@/db/schemas/enums';
import { Conflict, NotFound } from '@/server/utils/http-error';
import { canEditDeliveryFee } from '@/shared/shipments/delivery-fee';

type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DeliveryFeeScope = { parcelId: string; companyId: string; branchId: string };

export async function getDeliveryFeeContextRepo(scope: DeliveryFeeScope, tx: Executor) {
  const [parcel] = await tx
    .select()
    .from(parcels)
    .where(
      and(
        eq(parcels.id, scope.parcelId),
        eq(parcels.companyId, scope.companyId),
        eq(parcels.destinationId, scope.branchId),
        eq(parcels.isDeleted, false),
        isNull(parcels.deletedAt),
      ),
    )
    .for('update');
  if (!parcel) throw NotFound('Parcel not found at your branch');
  if (!canEditDeliveryFee(parcel.status))
    throw Conflict('Delivery fee cannot be edited in this parcel state');
  const rows = await tx
    .select()
    .from(deliveries)
    .where(and(eq(deliveries.parcelId, parcel.id), eq(deliveries.isDeleted, false)))
    .for('update');
  if (rows.length !== 1) throw Conflict('A single active delivery is required to edit its fee');
  const delivery = rows[0]!;
  const paid = await tx
    .select({ amount: payments.grossAmountPsw })
    .from(payments)
    .where(
      and(
        eq(payments.parcelId, parcel.id),
        eq(payments.component, PaymentComponent.DELIVERY_FEE),
        isNull(payments.voidedAt),
      ),
    );
  return { parcel, delivery, paidFeePsw: paid.reduce((sum, payment) => sum + payment.amount, 0) };
}
