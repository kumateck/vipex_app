import type {
  CustomerServiceSlaCreateInput,
  CustomerServiceSlaItem,
  CustomerServiceSlaListInput,
} from './dto';
import { createCustomerServiceSlaRepo, listCustomerServiceSlaRepo } from './repository';
import { BadRequest } from '@/server/utils/http-error';

export async function listCustomerServiceSlaSvc(
  input: CustomerServiceSlaListInput,
): Promise<CustomerServiceSlaItem[]> {
  return listCustomerServiceSlaRepo(input);
}

export async function createCustomerServiceSlaSvc(
  input: CustomerServiceSlaCreateInput,
): Promise<CustomerServiceSlaItem> {
  if (!input.name.trim()) throw BadRequest('SLA policy name is required');
  return createCustomerServiceSlaRepo(input);
}
