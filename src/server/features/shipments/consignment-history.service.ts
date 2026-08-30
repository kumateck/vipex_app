import { BadRequest, NotFound } from '@/server/utils/http-error';
import {
  getConsignmentPrintPayloadRepo,
  listConsignmentHistoryRepo,
} from './consignment-history.repository';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnly(value: string, endOfDay = false) {
  if (!DATE_ONLY_PATTERN.test(value)) throw BadRequest('Dates must use YYYY-MM-DD format');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw BadRequest('Invalid consignment date');
  }
  if (endOfDay) date.setUTCHours(23, 59, 59, 999);
  return date;
}

export function normalizeConsignmentHistoryRange(dateFrom: string, dateTo: string) {
  const from = parseDateOnly(dateFrom);
  const to = parseDateOnly(dateTo, true);
  if (to < from) throw BadRequest('End date must be on or after start date');
  return { dateFrom: from, dateTo: to };
}

export async function listConsignmentHistorySvc(input: {
  companyId: string;
  sourceId: string | null;
  dateFrom: string;
  dateTo: string;
}) {
  const range = normalizeConsignmentHistoryRange(input.dateFrom, input.dateTo);
  return listConsignmentHistoryRepo({ ...input, ...range });
}

export async function getConsignmentPrintPayloadSvc(input: {
  consignmentId: string;
  companyId: string;
  sourceId: string | null;
}) {
  const payload = await getConsignmentPrintPayloadRepo(input);
  if (!payload) throw NotFound('Consignment not found');
  return payload;
}
