import type {
  ItSupportTicketNoteCreateInput,
  ItSupportTicketsCreateInput,
  ItSupportTicketsListInput,
  ItSupportTicketsUpdateInput,
} from './dto';
import {
  createItSupportTicketNoteSvc,
  createItSupportTicketSvc,
  getItSupportTicketSvc,
  listItSupportTicketEventsSvc,
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

export async function getItSupportTicketsCtrl(input: { companyId: string; ticketId: string }) {
  return getItSupportTicketSvc(input);
}

export async function listItSupportTicketEventsCtrl(input: {
  companyId: string;
  ticketId: string;
}) {
  return listItSupportTicketEventsSvc(input);
}

export async function createItSupportTicketNoteCtrl(input: ItSupportTicketNoteCreateInput) {
  return createItSupportTicketNoteSvc(input);
}
