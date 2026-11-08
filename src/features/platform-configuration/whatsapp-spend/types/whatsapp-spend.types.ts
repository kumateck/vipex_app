export type SpendCounts = {
  messages: number;
  delivered: number;
  failed: number;
  billable: number;
  estimated: number;
  /** Platform managers only: delivered free by Meta but still billed to the client. */
  free?: number;
  unconfirmed: number;
  /** Platform managers only: billable messages sent before the first price start date. */
  unpriced?: number;
  amount: number;
};

export type SpendByEvent = SpendCounts & {
  eventCode: string;
  name: string;
  category: string;
  /** Price on the latest day of the period. */
  rate: number;
  /** True when the price changed during the period. */
  rateVaries: boolean;
};

export type SpendByDay = SpendCounts & { day: string };

export type MessagePrices = { authentication: number; utility: number; marketing: number };

export type PricePeriod = MessagePrices & {
  id: string;
  /** YYYY-MM-DD: applies from this day until the next period starts. */
  effectiveFrom: string;
  updatedAt: string;
};

export type WhatsAppPrices = {
  currency: string;
  isConfigured: boolean;
  /** Prices in force on the last day of the period, or null before the first price. */
  current: MessagePrices | null;
  history: PricePeriod[];
};

export type MetaSpendByCategory = { category: string; volume: number; cost: number };

export type MetaSpend =
  | { available: true; currency: string | null; total: number; byCategory: MetaSpendByCategory[] }
  | { available: false; error: string };

export type WhatsAppSpendReport = {
  period: { from: string; to: string };
  prices: WhatsAppPrices;
  totals: SpendCounts;
  byEvent: SpendByEvent[];
  daily: SpendByDay[];
  /** Only returned to platform managers. */
  metaCost: MetaSpend | null;
  margin: number | null;
};

export type WhatsAppBillingRatesInput = {
  effectiveFrom: string;
  currency: string;
  authentication: number;
  utility: number;
  marketing: number;
};
