import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useWhatsAppAvailability } from '@/features/platform-configuration/whatsapp-settings/hooks';
import { isDigitalReceiptChannel } from '@/shared/digital-receipts/channels';
import { useGetParcelReceiptOptionsQuery, useSendDigitalReceiptMutation } from '../services';
import type { DigitalReceiptChannel, ReceiptKind } from '../types';
import { summarizeDeliveryResults } from '../utils';

/** Manual send/resend of a parcel's digital receipt from the parcel details. */
export function useSendReceiptDialog(
  parcelId: string,
  onSent: () => void,
  initialKind: ReceiptKind = 'booking',
) {
  const [kind, setKind] = useState<ReceiptKind>(initialKind);
  const [draft, setDraft] = useState<{ kind: ReceiptKind; channels: DigitalReceiptChannel[] }>();
  const { isWhatsAppAvailable } = useWhatsAppAvailability();
  const { data: options, isFetching } = useGetParcelReceiptOptionsQuery({ parcelId, kind });
  const [send, { isLoading: isSending }] = useSendDigitalReceiptMutation();

  const availability = useMemo(() => {
    const recipients = options?.recipients ?? [];
    const hasPhone = recipients.some((r) => r.hasPhone);
    return {
      sms: hasPhone,
      whatsapp: hasPhone && isWhatsAppAvailable,
      email: recipients.some((r) => r.hasEmail),
      showWhatsApp: isWhatsAppAvailable,
    };
  }, [isWhatsAppAvailable, options?.recipients]);

  const defaults = useMemo(
    () =>
      (options?.defaultChannels ?? []).filter(
        (channel): channel is DigitalReceiptChannel =>
          isDigitalReceiptChannel(channel) && availability[channel],
      ),
    [availability, options?.defaultChannels],
  );
  const channels = draft?.kind === kind ? draft.channels : defaults;
  const setChannels = useCallback(
    (next: DigitalReceiptChannel[]) => setDraft({ kind, channels: next }),
    [kind],
  );

  const submit = useCallback(async () => {
    try {
      const response = await send({ parcelId, kind, channels }).unwrap();
      const summary = summarizeDeliveryResults(response.results);
      (summary.ok ? toast.success : toast.warning)(summary.message);
      onSent();
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Failed to send receipt');
    }
  }, [channels, kind, onSent, parcelId, send]);

  return {
    kind,
    setKind,
    channels,
    setChannels,
    availability,
    recipients: options?.recipients ?? [],
    isLoading: isFetching,
    isSending,
    submit,
  };
}
