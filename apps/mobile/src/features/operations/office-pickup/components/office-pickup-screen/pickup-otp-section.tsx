import { Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, AppStatusChip } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useOtpCountdown, type PickupOtp } from '../../hooks';
import type { OtpChannel, PhoneSlot } from '../../types';
import { formatCountdown, getOtpSendLabel, isCompleteOtp, OTP_LENGTH } from '../../utils';
import { PickupChoiceChips } from './pickup-choice-chips';
import { pickupStyles } from './office-pickup.styles';

const CHANNEL_OPTIONS = [
  { value: 'sms' as OtpChannel, label: 'SMS' },
  { value: 'whatsapp' as OtpChannel, label: 'WhatsApp' },
];

type Props = {
  otp: PickupOtp;
  receiverPhone?: string | null;
  receiverPhone2?: string | null;
  phoneSlot: PhoneSlot;
  onPhoneSlotChange: (slot: PhoneSlot) => void;
  isWhatsAppAvailable: boolean;
  disabled: boolean;
};

/** "Customer at premises" OTP check, matching the web pickup dialog. */
export function PickupOtpSection(props: Props) {
  const { otp, receiverPhone, receiverPhone2, phoneSlot, isWhatsAppAvailable } = props;
  const { theme } = useAppearance();
  const remaining = useOtpCountdown(otp.verified ? null : otp.expiresAt);
  const isExpired = Boolean(otp.sentAt) && remaining <= 0;
  const activePhone = phoneSlot === 'secondary' ? receiverPhone2 : receiverPhone;
  const busy = props.disabled || otp.requestPending || otp.verifyPending;
  const muted = { color: theme.colors.textMuted };

  return (
    <AppCard>
      <View style={pickupStyles.row}>
        <Text style={[pickupStyles.title, pickupStyles.flex, { color: theme.colors.text }]}>
          Customer at premises
        </Text>
        {otp.verified ? <AppStatusChip label="Verified" /> : null}
      </View>
      {otp.verified ? (
        <Text style={[pickupStyles.text, muted]}>
          Customer presence confirmed with the one-time collection code.
        </Text>
      ) : (
        <>
          <Text style={[pickupStyles.hint, muted]}>
            Verify the customer&apos;s collection OTP before releasing the parcel.
          </Text>
          {receiverPhone2 ? (
            <PickupChoiceChips
              label="Send to which number?"
              value={phoneSlot}
              disabled={busy}
              onChange={props.onPhoneSlotChange}
              options={[
                { value: 'primary', label: receiverPhone || 'Phone 1' },
                { value: 'secondary', label: receiverPhone2 || 'Phone 2' },
              ]}
            />
          ) : null}
          {isWhatsAppAvailable ? (
            <PickupChoiceChips
              label="Send the code by"
              value={otp.channel}
              options={CHANNEL_OPTIONS}
              disabled={busy}
              onChange={otp.setChannel}
            />
          ) : null}
          <AppButton
            title={getOtpSendLabel({ pending: otp.requestPending, sent: Boolean(otp.sentAt) })}
            variant={otp.sentAt ? 'secondary' : 'primary'}
            loading={otp.requestPending}
            disabled={busy}
            onPress={() => void otp.request()}
          />
          <Text
            style={[
              pickupStyles.hint,
              { color: isExpired ? theme.colors.danger : theme.colors.textMuted },
            ]}
          >
            {!otp.sentAt
              ? `A 6-digit code will be sent to the main receiver${activePhone ? ` (${activePhone})` : ''}.`
              : isExpired
                ? 'Code expired. Resend to try again.'
                : `Expires in ${formatCountdown(remaining)}`}
          </Text>
          {otp.sentAt && !isExpired ? (
            <>
              <AppInput
                value={otp.code}
                onChangeText={otp.setCode}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                editable={!busy}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />
              <AppButton
                title={otp.verifyPending ? 'Verifying…' : 'Verify customer'}
                loading={otp.verifyPending}
                disabled={busy || !isCompleteOtp(otp.code)}
                onPress={() => void otp.verify()}
              />
            </>
          ) : null}
        </>
      )}
    </AppCard>
  );
}
