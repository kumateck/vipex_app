import type {
  CustomerServiceTicketsCreateInput,
  CustomerServiceTicketsItem,
  CustomerServiceTicketsListInput,
} from './dto';
import { createCustomerServiceTicketsRepo, listCustomerServiceTicketsRepo } from './repository';
import { BadRequest } from '@/server/utils/http-error';

export async function listCustomerServiceTicketsSvc(
  input: CustomerServiceTicketsListInput,
): Promise<CustomerServiceTicketsItem[]> {
  return listCustomerServiceTicketsRepo(input);
}

export async function createCustomerServiceTicketsSvc(
  input: CustomerServiceTicketsCreateInput,
): Promise<CustomerServiceTicketsItem> {
  if (!input.subject && !input.description && !input.trackingCode && !input.bookingCode) {
    throw BadRequest(
      'Provide at least one ticket detail (subject, description, tracking code, or booking code)',
    );
  }
  return createCustomerServiceTicketsRepo(input);
}
