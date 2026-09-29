import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  customerCreditAllocations,
  customerCreditTransactions,
  CustomerCreditSourceType,
  CustomerCreditTransactionType,
} from '@/db/schemas';
import { Conflict } from '../../utils/http-error';
import { createCustomerCreditTransactionRepo } from '../customers/repository';

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function reverseDeliveryCreditCharges(input: {
  chargeIds: readonly string[];
  parcelId: string;
  companyId: string;
  actorUserId: string;
  reason: string;
  tx: DbTransaction;
}) {
  for (const id of input.chargeIds) {
    const [charge] = await input.tx
      .select()
      .from(customerCreditTransactions)
      .where(
        and(
          eq(customerCreditTransactions.id, id),
          eq(customerCreditTransactions.companyId, input.companyId),
        ),
      )
      .for('update');
    if (
      !charge ||
      charge.referenceId !== input.parcelId ||
      charge.sourceType !== CustomerCreditSourceType.DELIVERY ||
      charge.transactionType !== CustomerCreditTransactionType.CHARGE
    ) {
      throw Conflict('Delivery credit record changed; review before reversing');
    }
    const [allocation] = await input.tx
      .select({ id: customerCreditAllocations.id })
      .from(customerCreditAllocations)
      .where(eq(customerCreditAllocations.chargeTransactionId, id))
      .limit(1);
    if (allocation) throw Conflict('Delivery credit has an allocation; finance review is required');
    await createCustomerCreditTransactionRepo({
      companyId: input.companyId,
      customerId: charge.customerId,
      sourceType: CustomerCreditSourceType.DELIVERY,
      transactionType: CustomerCreditTransactionType.ADJUSTMENT,
      referenceId: id,
      signedAmountPsw: -Number(charge.signedAmountPsw),
      notes: `Delivery confirmation reversed: ${input.reason}`,
      createdBy: input.actorUserId,
      executor: input.tx,
    });
  }
  return input.chargeIds.length;
}
