import type {
  ItSupportTicketsCreateInput,
  ItSupportTicketsListInput,
  ItSupportTicketsUpdateInput,
} from './dto';
import {
  createItSupportTicketSvc,
  listItSupportTicketsSvc,
  updateItSupportTicketSvc,
} from './service';

export async function listItSupportTicketsCtrl(input: ItSupportTicketsListInput) {
  return listItSupportTicketsSvc(input);
}

export async function createItSupportTicketsCtrl(input: ItSupportTicketsCreateInput) {
  return createItSupportTicketSvc(input);
}

export async function updateItSupportTicketsCtrl(input: ItSupportTicketsUpdateInput) {
  return updateItSupportTicketSvc(input);
}
