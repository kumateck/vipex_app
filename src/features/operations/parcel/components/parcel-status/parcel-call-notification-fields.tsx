import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function ParcelCallNotificationFields({
  idPrefix = 'call',
  sendSms,
  onSendSmsChange,
  sendEmail,
  onSendEmailChange,
  disabled = false,
  smsDescription,
}: {
  idPrefix?: string;
  sendSms: boolean;
  onSendSmsChange: (value: boolean) => void;
  sendEmail?: boolean;
  onSendEmailChange?: (value: boolean) => void;
  disabled?: boolean;
  smsDescription?: string;
}) {
  const smsId = `${idPrefix}-send-sms`;
  const emailId = `${idPrefix}-send-email`;
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-sm font-medium">Send Notification</p>
      <div className="flex items-center justify-between">
        <Label htmlFor={smsId}>Send SMS</Label>
        <Checkbox
          id={smsId}
          checked={sendSms}
          disabled={disabled}
          onCheckedChange={(checked) => onSendSmsChange(checked === true)}
          aria-describedby={smsDescription ? `${smsId}-description` : undefined}
        />
      </div>
      {smsDescription ? (
        <p id={`${smsId}-description`} className="text-sm text-muted-foreground">
          {smsDescription}
        </p>
      ) : null}
      {onSendEmailChange ? (
        <div className="flex items-center justify-between">
          <Label htmlFor={emailId}>Send Email</Label>
          <Checkbox
            id={emailId}
            checked={sendEmail}
            disabled={disabled}
            onCheckedChange={(checked) => onSendEmailChange(checked === true)}
          />
        </div>
      ) : null}
    </div>
  );
}
