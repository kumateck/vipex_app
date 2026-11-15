import { AppSelectField } from '@mobile/components/ui/mobile';
import type { BatchHandoverChannel } from '@/shared/shipments/parcel-batch-handover';

const CHANNELS = [
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export function MobileBatchChannel({
  available,
  channel,
  disabled,
  onChange,
}: {
  available: boolean;
  channel: BatchHandoverChannel;
  disabled: boolean;
  onChange: (channel: BatchHandoverChannel) => void;
}) {
  return available ? (
    <AppSelectField
      label="Send the OTP by"
      value={channel}
      options={CHANNELS}
      disabled={disabled}
      onValueChange={(value) => onChange(value === 'whatsapp' ? 'whatsapp' : 'sms')}
    />
  ) : null;
}
