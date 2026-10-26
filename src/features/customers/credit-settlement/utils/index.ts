const creditMoneyFormatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });
export const formatCreditMoney = (amountPsw: number) =>
  creditMoneyFormatter.format(amountPsw / 100);
export { parsePositiveCedis } from '@/shared/customers/credit-settlement';
