import type { CustomerServiceFeedbackCreateInput, CustomerServiceFeedbackListInput } from './dto';
import { createCustomerServiceFeedbackSvc, listCustomerServiceFeedbackSvc } from './service';

export async function listCustomerServiceFeedbackCtrl(input: CustomerServiceFeedbackListInput) {
  return listCustomerServiceFeedbackSvc(input);
}

export async function createCustomerServiceFeedbackCtrl(input: CustomerServiceFeedbackCreateInput) {
  return createCustomerServiceFeedbackSvc(input);
}
