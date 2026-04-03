import type {
  CustomerServiceConversationsCreateInput,
  CustomerServiceConversationsListInput,
} from './dto';
import {
  createCustomerServiceConversationsSvc,
  listCustomerServiceConversationsSvc,
} from './service';

export async function listCustomerServiceConversationsCtrl(
  input: CustomerServiceConversationsListInput,
) {
  return listCustomerServiceConversationsSvc(input);
}

export async function createCustomerServiceConversationsCtrl(
  input: CustomerServiceConversationsCreateInput,
) {
  return createCustomerServiceConversationsSvc(input);
}
