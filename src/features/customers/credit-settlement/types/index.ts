export type CreditChannel = 'crm' | 'finance';
export type SettlementProps = { customerId: string; channel: CreditChannel };
export type { CreditParcel, CreditSettlementInput } from '@/shared/customers/credit-settlement';
