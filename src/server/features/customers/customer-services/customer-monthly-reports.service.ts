import { BadRequest, NotFound } from '../../../utils/http-error';
import {
  getCustomerRepo,
  listCustomerCreditPaymentsRepo,
  listCustomerParcelPaymentsRepo,
  listCustomerTransactionsMonthlyRepo,
} from '../repository';
import { isMissingRelationError } from './customer-credit.service';
import { debugCustomerServiceError } from './customer-error.utils';

export async function getCustomerPaymentsMonthlySvc(input: {
  customerId: string;
  companyId: string;
  year?: number;
}) {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

  const now = new Date();
  const year = Number.isFinite(input.year) ? Math.trunc(Number(input.year)) : now.getFullYear();
  if (year < 2000 || year > 2100) throw BadRequest('Invalid year');

  const dateFrom = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const dateTo = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const [parcelPayments, creditPayments] = await Promise.all([
    (async () => {
      try {
        return await listCustomerParcelPaymentsRepo({
          customerId: input.customerId,
          companyId: input.companyId,
          dateFrom,
          dateTo,
          limit: 20000,
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
          limit: 20000,
        });
      } catch (error) {
        if (isMissingRelationError(error)) return [];
        throw error;
      }
    })(),
  ]);

  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    monthLabel: new Date(Date.UTC(year, index, 1)).toLocaleString('en-US', { month: 'short' }),
    totalPsw: 0,
    parcelPaymentsPsw: 0,
    creditPaymentsPsw: 0,
  }));

  for (const payment of parcelPayments) {
    const monthIndex = payment.createdAt.getUTCMonth();
    monthly[monthIndex]!.totalPsw += payment.amountPsw;
    monthly[monthIndex]!.parcelPaymentsPsw += payment.amountPsw;
  }
  for (const payment of creditPayments) {
    const monthIndex = payment.createdAt.getUTCMonth();
    monthly[monthIndex]!.totalPsw += payment.amountPsw;
    monthly[monthIndex]!.creditPaymentsPsw += payment.amountPsw;
  }

  const yearTotalPsw = monthly.reduce((acc, row) => acc + row.totalPsw, 0);

  return {
    year,
    yearTotalPsw,
    months: monthly,
  };
}

export async function getCustomerTransactionsMonthlySvc(input: {
  customerId: string;
  companyId: string;
  year?: number;
}) {
  try {
    const customer = await getCustomerRepo(input.customerId);
    if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

    const now = new Date();
    const year = Number.isFinite(input.year) ? Math.trunc(Number(input.year)) : now.getFullYear();
    if (year < 2000 || year > 2100) throw BadRequest('Invalid year');

    let byMonth: Awaited<ReturnType<typeof listCustomerTransactionsMonthlyRepo>> = [];
    try {
      byMonth = await listCustomerTransactionsMonthlyRepo({
        customerId: input.customerId,
        companyId: input.companyId,
        year,
      });
    } catch (error) {
      if (!isMissingRelationError(error)) throw error;
    }

    const months = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      monthLabel: new Date(Date.UTC(year, index, 1)).toLocaleString('en-US', { month: 'short' }),
      sentCount: 0,
      receivedCount: 0,
      sentAmountPsw: 0,
      receivedAmountPsw: 0,
    }));

    for (const row of byMonth) {
      const idx = row.month - 1;
      if (idx < 0 || idx > 11) continue;
      months[idx]!.sentCount = row.sentCount;
      months[idx]!.receivedCount = row.receivedCount;
      months[idx]!.sentAmountPsw = row.sentAmountPsw;
      months[idx]!.receivedAmountPsw = row.receivedAmountPsw;
    }

    return {
      year,
      totalSentCount: months.reduce((acc, row) => acc + row.sentCount, 0),
      totalReceivedCount: months.reduce((acc, row) => acc + row.receivedCount, 0),
      totalSentAmountPsw: months.reduce((acc, row) => acc + row.sentAmountPsw, 0),
      totalReceivedAmountPsw: months.reduce((acc, row) => acc + row.receivedAmountPsw, 0),
      months,
    };
  } catch (error) {
    debugCustomerServiceError(
      'getCustomerTransactionsMonthlySvc',
      input as Record<string, unknown>,
      error,
    );
    throw error;
  }
}
