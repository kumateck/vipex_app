import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useWhatsAppAvailability } from '@/features/platform-configuration/whatsapp-settings/hooks';

export type OtpChannel = 'sms' | 'whatsapp';

/**
 * SMS/WhatsApp choice for the pickup OTP. Renders nothing unless the
 * WhatsApp Messaging module is enabled and configured, so SMS-only
 * companies see the screen exactly as before.
 */
export const OtpChannelToggle = memo(function OtpChannelToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: OtpChannel;
  onChange: (channel: OtpChannel) => void;
  disabled?: boolean;
}) {
  const { isWhatsAppAvailable } = useWhatsAppAvailability();
  if (!isWhatsAppAvailable) return null;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Send the code by</Label>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          if (next) onChange(next as OtpChannel);
        }}
      >
        <ToggleGroupItem value="sms">SMS</ToggleGroupItem>
        <ToggleGroupItem value="whatsapp">WhatsApp</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
});

export function otpChannelLabel(channel: OtpChannel, isWhatsAppAvailable: boolean) {
  return isWhatsAppAvailable ? (channel === 'whatsapp' ? ' by WhatsApp' : ' by SMS') : '';
}
