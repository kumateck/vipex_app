import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListCustomerWalletAccountsQuery } from '../api/customer-wallet-credit.api';

export function useWalletPaymentCustomer() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('__none__');
  const [customerSearch, setCustomerSearch] = useState('');

  const customerQuery = useMemo(
    () => ({ page: 1, pageSize: 100, search: customerSearch.trim() || undefined }),
    [customerSearch],
  );

  const { data: customerData } = useListCustomerWalletAccountsQuery(customerQuery);
  const customers = customerData?.data ?? [];
  const cancel = () => navigate('/customer-wallet-credit/accounts');
  return { customerId, setCustomerId, customerSearch, setCustomerSearch, customers, cancel };
}
