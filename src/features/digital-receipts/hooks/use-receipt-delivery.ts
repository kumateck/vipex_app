import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useWhatsAppAvailability } from '@/features/platform-configuration/whatsapp-settings/hooks';
import {
  DEFAULT_RECEIPT_DELIVERY_CHANNELS,
  isDigitalReceiptChannel,
  normalizeReceiptChannels,
} from '@/shared/digital-receipts/channels';
import {
  useGetCustomerReceiptPreferenceQuery,
  useSaveCustomerReceiptPreferenceMutation,
  useSendDigitalReceiptMutation,
} from '../services';
import type { ReceiptChannelAvailability, ReceiptDeliveryChannel, ReceiptKind } from '../types';
import { summarizeDeliveryResults } from '../utils';
import { useDigitalReceiptsModule } from './use-digital-receipts-module';

const sameChannels = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * Receipt delivery choice for the paying customer at booking/payment time.
 * Starts from the customer's saved default; `deliver` saves a changed choice
 * as the new default and sends the digital channels. When the Digital
 * Receipts module is off it is inert and `includesPhysical` stays true, so
 * printing behaves exactly as before.
 */
export function useReceiptDelivery(customerId: string | null | undefined) {
  const { isDigitalReceiptsEnabled } = useDigitalReceiptsModule();
  const { isWhatsAppAvailable } = useWhatsAppAvailability();
  const { data: preference } = useGetCustomerReceiptPreferenceQuery(customerId ?? '', {
    skip: !isDigitalReceiptsEnabled || !customerId,
  });
  const [draft, setDraft] = useState<{ customerId: string; channels: ReceiptDeliveryChannel[] }>();
  const [savePreference] = useSaveCustomerReceiptPreferenceMutation();
  const [sendReceipt] = useSendDigitalReceiptMutation();

  const savedChannels = preference?.channels ?? DEFAULT_RECEIPT_DELIVERY_CHANNELS;
  const channels = draft && draft.customerId === customerId ? draft.channels : savedChannels;
  const setChannels = useCallback(
    (next: ReceiptDeliveryChannel[]) => {
      if (customerId) setDraft({ customerId, channels: normalizeReceiptChannels(next) });
    },
    [customerId],
  );

  const availability = useMemo<ReceiptChannelAvailability>(
    () => ({
      sms: Boolean(preference?.hasPhone),
      whatsapp: Boolean(preference?.hasPhone) && isWhatsAppAvailable,
      email: Boolean(preference?.hasEmail),
      showWhatsApp: isWhatsAppAvailable,
    }),
    [isWhatsAppAvailable, preference?.hasEmail, preference?.hasPhone],
  );

  const deliver = useCallback(
    async (parcelIds: string[], kind: ReceiptKind) => {
      if (!isDigitalReceiptsEnabled || !customerId) return;
      try {
        if (!sameChannels(channels, savedChannels)) {
          await savePreference({ customerId, channels }).unwrap();
        }
        const digital = channels.filter(
          (channel) => isDigitalReceiptChannel(channel) && availability[channel],
        );
        if (!digital.length || !parcelIds.length) return;
        const responses = await Promise.all(
          parcelIds.map((parcelId) => sendReceipt({ parcelId, kind, channels: digital }).unwrap()),
        );
        const summary = summarizeDeliveryResults(responses.flatMap((r) => r.results));
        (summary.ok ? toast.success : toast.warning)(summary.message);
      } catch {
        // The booking/payment already succeeded; only the digital copy failed.
        toast.warning(
          'Receipt saved, but the digital copy could not be sent. Use "Send receipt" to retry.',
        );
      }
    },
    [
      availability,
      channels,
      customerId,
      isDigitalReceiptsEnabled,
      savePreference,
      savedChannels,
      sendReceipt,
    ],
  );

  return {
    isEnabled: isDigitalReceiptsEnabled && Boolean(customerId),
    channels,
    setChannels,
    availability,
    includesPhysical: !isDigitalReceiptsEnabled || channels.includes('physical'),
    deliver,
  };
}

export type ReceiptDelivery = ReturnType<typeof useReceiptDelivery>;
