import { NotFound } from '../../../utils/http-error';
import {
  getCustomerCreditBalanceBeforeDateRepo,
  getCustomerRepo,
  listCustomerCreditTransactionsByDateRepo,
  listCustomerStatementPaymentsRepo,
  listCustomerStatementReceivedParcelsRepo,
  listCustomerStatementSentParcelsRepo,
  type CustomerCreditTransactionRow,
} from '../repository';
import { Payer, PaymentComponent } from '@/db/schemas/enums';
import {
  parseDateRange,
  toSafeIso,
  toSafeNumber,
  isMissingRelationError,
} from './customer-credit.service';
import { debugCustomerServiceError } from './customer-error.utils';

export async function getCustomerStatementSvc(input: {
  customerId: string;
  companyId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  try {
    const customer = await getCustomerRepo(input.customerId);
    if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

    const { dateFrom, dateTo } = parseDateRange(input);

    const creditRowsPromise = (async () => {
      try {
        return await listCustomerCreditTransactionsByDateRepo({
          customerId: input.customerId,
          companyId: input.companyId,
          dateFrom,
          dateTo,
        });
      } catch (error) {
        if (isMissingRelationError(error)) return [] as CustomerCreditTransactionRow[];
        throw error;
      }
    })();

    const openingCreditBalancePromise = dateFrom
      ? (async () => {
          try {
            return await getCustomerCreditBalanceBeforeDateRepo({
              customerId: input.customerId,
              companyId: input.companyId,
              before: dateFrom,
            });
          } catch (error) {
            if (isMissingRelationError(error)) return 0;
            throw error;
          }
        })()
      : Promise.resolve(0);

    const [sentParcels, receivedParcels, paymentsRows, creditRows, openingCreditBalancePsw] =
      await Promise.all([
        (async () => {
          try {
            return await listCustomerStatementSentParcelsRepo({
              customerId: input.customerId,
              companyId: input.companyId,
              dateFrom,
              dateTo,
            });
          } catch (error) {
            if (isMissingRelationError(error)) return [];
            throw error;
          }
        })(),
        (async () => {
          try {
            return await listCustomerStatementReceivedParcelsRepo({
              customerId: input.customerId,
              companyId: input.companyId,
              dateFrom,
              dateTo,
            });
          } catch (error) {
            if (isMissingRelationError(error)) return [];
            throw error;
          }
        })(),
        (async () => {
          try {
            return await listCustomerStatementPaymentsRepo({
              customerId: input.customerId,
              companyId: input.companyId,
              dateFrom,
              dateTo,
            });
          } catch (error) {
            if (isMissingRelationError(error)) return [];
            throw error;
          }
        })(),
        creditRowsPromise,
        openingCreditBalancePromise,
      ]);

    const sentRows = sentParcels.flatMap((row) => {
      const timestamp = toSafeIso(row.createdAt);
      if (!timestamp) return [];
      return {
        id: `parcel-sent:${row.id}`,
        timestamp,
        entryType: 'PARCEL_SENT' as const,
        direction: 'info' as const,
        amountPsw: toSafeNumber(row.chargePsw),
        parcelId: row.id,
        bookingCode: row.bookingCode,
        trackingCode: row.trackingCode,
        method: row.method,
        notes: 'Parcel sent',
      };
    });

    const receivedRows = receivedParcels.flatMap((row) => {
      const timestamp = toSafeIso(row.createdAt);
      if (!timestamp) return [];
      return {
        id: `parcel-received:${row.id}`,
        timestamp,
        entryType: 'PARCEL_RECEIVED' as const,
        direction: 'info' as const,
        amountPsw: toSafeNumber(row.plannedToBePaidPsw),
        parcelId: row.id,
        bookingCode: row.bookingCode,
        trackingCode: row.trackingCode,
        method: row.method,
        notes: 'Parcel received',
      };
    });

    const paymentRows = paymentsRows.flatMap((row) => {
      const timestamp = toSafeIso(row.receivedAt);
      if (!timestamp) return [];
      const customerIsSender = row.senderId === input.customerId;
      const customerIsReceiver =
        row.receiverId === input.customerId || row.secondReceiverId === input.customerId;
      const madeByCustomer =
        (row.payer === Payer.SENDER && customerIsSender) ||
        (row.payer === Payer.RECIPIENT && customerIsReceiver);
      return {
        id: `payment:${row.id}`,
        timestamp,
        entryType: 'PAYMENT' as const,
        direction: madeByCustomer ? ('credit' as const) : ('info' as const),
        amountPsw: toSafeNumber(row.grossAmountPsw),
        parcelId: row.parcelId,
        bookingCode: row.bookingCode,
        trackingCode: row.trackingCode,
        method: row.method,
        notes:
          row.component === PaymentComponent.DELIVERY_FEE
            ? madeByCustomer
              ? 'Delivery fee paid by customer'
              : 'Delivery fee payment (other payer)'
            : madeByCustomer
              ? 'Payment made by customer'
              : 'Payment recorded (other payer)',
      };
    });

    const creditStatementRows = creditRows.flatMap((row) => {
      const timestamp = toSafeIso(row.createdAt);
      if (!timestamp) return [];
      const signedAmountPsw = toSafeNumber(row.signedAmountPsw);
      return {
        id: `credit:${row.id}`,
        timestamp,
        entryType: 'CREDIT' as const,
        direction: signedAmountPsw >= 0 ? ('debit' as const) : ('credit' as const),
        amountPsw: Math.abs(signedAmountPsw),
        parcelId: row.referenceId ?? null,
        bookingCode: null,
        trackingCode: null,
        method: null,
        notes: row.notes ?? (signedAmountPsw >= 0 ? 'Credit charge' : 'Credit payment'),
      };
    });

    const rows = [...sentRows, ...receivedRows, ...paymentRows, ...creditStatementRows].sort(
      (a, b) => {
        if (a.timestamp === b.timestamp) return a.id < b.id ? 1 : -1;
        return a.timestamp < b.timestamp ? 1 : -1;
      },
    );

    const creditChargesPsw = creditRows
      .filter((row) => toSafeNumber(row.signedAmountPsw) > 0)
      .reduce((acc, row) => acc + toSafeNumber(row.signedAmountPsw), 0);
    const creditPaymentsPsw = creditRows
      .filter((row) => toSafeNumber(row.signedAmountPsw) < 0)
      .reduce((acc, row) => acc + Math.abs(toSafeNumber(row.signedAmountPsw)), 0);
    const paymentsMadeByCustomerPsw = paymentsRows.reduce((acc, row) => {
      const customerIsSender = row.senderId === input.customerId;
      const customerIsReceiver =
        row.receiverId === input.customerId || row.secondReceiverId === input.customerId;
      const madeByCustomer =
        (row.payer === Payer.SENDER && customerIsSender) ||
        (row.payer === Payer.RECIPIENT && customerIsReceiver);
      return madeByCustomer ? acc + toSafeNumber(row.grossAmountPsw) : acc;
    }, 0);

    const closingCreditBalancePsw = openingCreditBalancePsw + creditChargesPsw - creditPaymentsPsw;

    return {
      customer: {
        id: customer.id,
        fullname: customer.fullname,
        customerType: customer.customerType,
      },
      range: {
        dateFrom: dateFrom?.toISOString() ?? null,
        dateTo: dateTo?.toISOString() ?? null,
      },
      summary: {
        sentParcels: sentParcels.length,
        receivedParcels: receivedParcels.length,
        totalSentChargePsw: sentParcels.reduce((acc, row) => acc + toSafeNumber(row.chargePsw), 0),
        totalReceivingToPayPsw: receivedParcels.reduce(
          (acc, row) => acc + toSafeNumber(row.plannedToBePaidPsw),
          0,
        ),
        paymentsMadeByCustomerPsw,
        creditChargesPsw,
        creditPaymentsPsw,
        openingCreditBalancePsw,
        closingCreditBalancePsw,
      },
      rows,
    };
  } catch (error) {
    debugCustomerServiceError('getCustomerStatementSvc', input as Record<string, unknown>, error);
    throw error;
  }
}
