import { getParcelPaymentStatus } from '@/shared/shipments/parcel-payment-status';
import { NotFound } from '../../../utils/http-error';
import {
  getCustomerRepo,
  listCustomerCreditPaymentsRepo,
  listCustomerOpenCreditChargesRepo,
  listCustomerParcelPaymentsRepo,
  listCustomerTransactionsRepo,
} from '../repository';
import { parseDateRange, isMissingRelationError } from './customer-credit.service';

export async function listCustomerTransactionsSvc(input: {
  customerId: string;
  companyId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit: number;
  offset: number;
}) {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');
  const { dateFrom, dateTo } = parseDateRange(input);
  const result = await listCustomerTransactionsRepo({
    customerId: input.customerId,
    companyId: input.companyId,
    dateFrom,
    dateTo,
    limit: input.limit,
    offset: input.offset,
  });
  return {
    totalRecords: result.totalRecords,
    data: result.data.map((row) => {
      const isSender = row.senderId === input.customerId;
      return {
        id: row.id,
        bookingCode: row.bookingCode,
        trackingCode: row.trackingCode,
        sourceId: row.sourceId,
        destinationId: row.destinationId,
        status: row.status,
        chargePsw: row.chargePsw,
        method: row.method,
        paymentStatus: getParcelPaymentStatus(row),
        paidPrincipalPsw: row.paidPrincipalPsw,
        creditPaidPsw: row.creditPaidPsw,
        transactionRole: isSender ? ('SENDER' as const) : ('RECEIVER' as const),
        createdAt: row.createdAt,
      };
    }),
  };
}

export async function listCustomerPaymentsSvc(input: {
  customerId: string;
  companyId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit: number;
  offset: number;
}): Promise<{
  data: Array<{
    id: string;
    source: 'PARCEL_PAYMENT' | 'CREDIT_PAYMENT';
    amountPsw: number;
    method: number | null;
    bookingCode: string | null;
    trackingCode: string | null;
    notes: string | null;
    createdAt: Date;
  }>;
  totalRecords: number;
}> {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');
  const { dateFrom, dateTo } = parseDateRange(input);

  const [parcelPayments, creditPayments] = await Promise.all([
    (async () => {
      try {
        return await listCustomerParcelPaymentsRepo({
          customerId: input.customerId,
          companyId: input.companyId,
          dateFrom,
          dateTo,
          limit: 2000,
        });
      } catch (error) {
        if (isMissingRelationError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await listCustomerCreditPaymentsRepo({
          customerId: input.customerId,
          companyId: input.companyId,
          dateFrom,
          dateTo,
          limit: 2000,
        });
      } catch (error) {
        if (isMissingRelationError(error)) return [];
        throw error;
      }
    })(),
  ]);

  const merged = [...parcelPayments, ...creditPayments].sort((a, b) => {
    if (a.createdAt.getTime() === b.createdAt.getTime()) return a.id < b.id ? 1 : -1;
    return a.createdAt.getTime() < b.createdAt.getTime() ? 1 : -1;
  });

  const totalRecords = merged.length;
  const data = merged.slice(input.offset, input.offset + input.limit);
  return { data, totalRecords };
}

export async function listCustomerCreditOpenItemsSvc(input: {
  customerId: string;
  companyId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');
  const { dateFrom, dateTo } = parseDateRange(input);
  let rows = [] as Awaited<ReturnType<typeof listCustomerOpenCreditChargesRepo>>;
  try {
    rows = await listCustomerOpenCreditChargesRepo({
      customerId: input.customerId,
      companyId: input.companyId,
    });
  } catch (error) {
    if (!isMissingRelationError(error)) throw error;
  }

  return rows.filter((row) => {
    if (dateFrom && row.createdAt < dateFrom) return false;
    if (dateTo && row.createdAt > dateTo) return false;
    return true;
  });
}
