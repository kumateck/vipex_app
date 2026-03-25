import { BadRequest, NotFound } from '../../utils/http-error';
import {
  countParcelsForBookingRepo,
  createBookingRepo,
  getBookingRepo,
  listBookingsRepo,
  type BookingRow,
  type ListBookingsParams,
} from './bookings.repository';

export async function listBookingsSvc(p: ListBookingsParams) {
  return listBookingsRepo(p);
}
export async function getBookingSvc(id: string): Promise<BookingRow & { parcelCount: number }> {
  const b = await getBookingRepo(id);
  if (!b) throw NotFound('Booking not found');
  const count = await countParcelsForBookingRepo(id);
  return { ...b, parcelCount: count };
}
export async function createBookingSvc(input: {
  companyId: string;
  sourceId: string;
  createdBy: string;
  cashierSessionId?: string | null;
}) {
  if (!input.companyId || !input.sourceId || !input.createdBy) {
    throw BadRequest('Missing required fields');
  }
  const created = await createBookingRepo({
    companyId: input.companyId,
    sourceId: input.sourceId,
    createdBy: input.createdBy,
    cashierSessionId: input.cashierSessionId ?? null,
  });
  return { id: created.id };
}
