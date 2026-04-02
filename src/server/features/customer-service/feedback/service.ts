import type {
  CustomerServiceFeedbackCreateInput,
  CustomerServiceFeedbackItem,
  CustomerServiceFeedbackListInput,
} from './dto';
import { createCustomerServiceFeedbackRepo, listCustomerServiceFeedbackRepo } from './repository';

export async function listCustomerServiceFeedbackSvc(
  input: CustomerServiceFeedbackListInput,
): Promise<CustomerServiceFeedbackItem[]> {
  return listCustomerServiceFeedbackRepo(input);
}

export async function createCustomerServiceFeedbackSvc(
  input: CustomerServiceFeedbackCreateInput,
): Promise<CustomerServiceFeedbackItem> {
  return createCustomerServiceFeedbackRepo(input);
}
