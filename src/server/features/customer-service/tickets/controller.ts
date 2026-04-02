import type { CustomerServiceTicketsCreateInput, CustomerServiceTicketsListInput } from './dto';
import { createCustomerServiceTicketsSvc, listCustomerServiceTicketsSvc } from './service';

export async function listCustomerServiceTicketsCtrl(input: CustomerServiceTicketsListInput) {
  return listCustomerServiceTicketsSvc(input);
}

export async function createCustomerServiceTicketsCtrl(input: CustomerServiceTicketsCreateInput) {
  return createCustomerServiceTicketsSvc(input);
}
