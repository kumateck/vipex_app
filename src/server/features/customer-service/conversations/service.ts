import type {
  CustomerServiceConversationsCreateInput,
  CustomerServiceConversationsItem,
  CustomerServiceConversationsListInput,
} from './dto';
import {
  createCustomerServiceConversationsRepo,
  listCustomerServiceConversationsRepo,
} from './repository';

export async function listCustomerServiceConversationsSvc(
  input: CustomerServiceConversationsListInput,
): Promise<CustomerServiceConversationsItem[]> {
  return listCustomerServiceConversationsRepo(input);
}

export async function createCustomerServiceConversationsSvc(
  input: CustomerServiceConversationsCreateInput,
): Promise<CustomerServiceConversationsItem> {
  return createCustomerServiceConversationsRepo(input);
}
