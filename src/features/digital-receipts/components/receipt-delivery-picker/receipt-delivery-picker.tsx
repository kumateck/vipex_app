import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ReceiptDelivery } from '../../hooks/use-receipt-delivery';
import type { ReceiptDeliveryChannel } from '../../types';
import { RECEIPT_CHANNEL_LABEL } from '../../utils';

/**
 * Multi-select of how the customer wants the receipt: Physical, SMS,
 * WhatsApp, Email. Hidden when the Digital Receipts module is off.
 */
export const ReceiptDeliveryPicker = memo(function ReceiptDeliveryPicker({
  delivery,
  disabled = false,
  label = 'Receipt delivery',
}: {
  delivery: ReceiptDelivery;
  disabled?: boolean;
  label?: string;
}) {
  if (!delivery.isEnabled) return null;
  const { availability } = delivery;
  const unavailableHint = [
    !availability.sms ? 'no phone on file' : null,
    !availability.email ? 'no email on file' : null,
  ].filter(Boolean);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={delivery.channels}
        disabled={disabled}
        onValueChange={(value) => delivery.setChannels(value as ReceiptDeliveryChannel[])}
        className="flex-wrap justify-start"
      >
        <ToggleGroupItem value="physical">{RECEIPT_CHANNEL_LABEL.physical}</ToggleGroupItem>
        <ToggleGroupItem value="sms" disabled={!availability.sms}>
          {RECEIPT_CHANNEL_LABEL.sms}
        </ToggleGroupItem>
        {availability.showWhatsApp ? (
          <ToggleGroupItem value="whatsapp" disabled={!availability.whatsapp}>
            {RECEIPT_CHANNEL_LABEL.whatsapp}
          </ToggleGroupItem>
        ) : null}
        <ToggleGroupItem value="email" disabled={!availability.email}>
          {RECEIPT_CHANNEL_LABEL.email}
        </ToggleGroupItem>
      </ToggleGroup>
      {unavailableHint.length ? (
        <p className="text-xs text-muted-foreground">
          Customer has {unavailableHint.join(' and ')}.
        </p>
      ) : null}
    </div>
  );
});
