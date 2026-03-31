import type { CustomerServiceSlaCreateInput, CustomerServiceSlaListInput } from './dto';
import { createCustomerServiceSlaSvc, listCustomerServiceSlaSvc } from './service';

export async function listCustomerServiceSlaCtrl(input: CustomerServiceSlaListInput) {
  return listCustomerServiceSlaSvc(input);
}

export async function createCustomerServiceSlaCtrl(input: CustomerServiceSlaCreateInput) {
  return createCustomerServiceSlaSvc(input);
}
