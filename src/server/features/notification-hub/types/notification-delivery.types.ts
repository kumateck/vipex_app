import type { getDefaultProviderByChannelRepo } from '../repository';
export type ProviderRow = Awaited<ReturnType<typeof getDefaultProviderByChannelRepo>>;
export type DeliveryResult = {
  status: 'sent' | 'failed';
  providerMessageId?: string | null;
  errorMessage?: string | null;
};
