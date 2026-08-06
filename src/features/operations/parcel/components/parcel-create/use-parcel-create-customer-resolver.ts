import { useCreateCustomerMutation } from '@/features/customers/api';
import { sanitizeString } from '@/lib/utils';

type ResolveCustomerParams = {
  customerId: string;
  fullname: string;
  telephone: string;
  telephone2?: string;
  label: string;
};

export function useParcelCreateCustomerResolver() {
  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();

  const resolveCustomerId = async (params: ResolveCustomerParams, cache: Map<string, string>) => {
    if (params.customerId) return params.customerId;
    const phone = params.telephone.trim();
    const name = params.fullname.trim();

    if (!phone || !name) {
      throw new Error(`${params.label} telephone and fullname are required`);
    }

    const cachedId = cache.get(phone);
    if (cachedId) return cachedId;

    const secondaryPhone = sanitizeString(params.telephone2).trim();
    const created = await createCustomer({
      fullname: name,
      telephone: phone,
      telephone2: secondaryPhone || null,
    }).unwrap();
    cache.set(phone, created.id);
    return created.id;
  };

  return { isCreatingCustomer, resolveCustomerId };
}
