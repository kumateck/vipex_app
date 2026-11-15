import { Text } from 'react-native';
import { AppButton, AppCard, AppInput, AppLabel } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useBatchOtpResend } from '@/features/operations/parcel-batch-handover/hooks/shared';
import { formatBatchAmount } from '@/features/operations/parcel-batch-handover/utils';
import type { BatchOtpSession } from '@/shared/shipments/parcel-batch-handover';
import type { useMobileBatchHandover } from '../../hooks';
import { MobileBatchChannel } from './mobile-batch-channel';
import { MobileBatchCheckout } from './mobile-batch-checkout';

export function MobileBatchVerification({
  flow,
  session,
  whatsappAvailable,
}: {
  flow: ReturnType<typeof useMobileBatchHandover>;
  session: BatchOtpSession;
  whatsappAvailable: boolean;
}) {
  const { theme } = useAppearance();
  const seconds = useBatchOtpResend(session.resendAt);
  return (
    <>
      <AppCard>
        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
          {flow.selected.length} selected parcels
        </Text>
        {flow.selected.map((parcel) => (
          <Text key={parcel.id} style={{ color: theme.colors.textMuted }}>
            {parcel.trackingCode}
          </Text>
        ))}
        {flow.totalPsw > 0 ? (
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
            Amount due {formatBatchAmount(flow.totalPsw)}
          </Text>
        ) : null}
      </AppCard>
      <AppCard>
        {flow.proof ? (
          <MobileBatchCheckout flow={flow} />
        ) : (
          <>
            <AppLabel>Six-digit OTP sent to {flow.telephone}</AppLabel>
            <AppInput
              accessibilityLabel="Six-digit OTP"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              maxLength={6}
              editable={!flow.busy}
              value={flow.otp}
              onChangeText={(value) => flow.setOtp(value.replace(/\D/g, ''))}
            />
            <AppButton
              title="Verify OTP"
              disabled={flow.busy || flow.otp.length !== 6}
              onPress={() => void flow.verifyOtp()}
            />
          </>
        )}
        <MobileBatchChannel
          available={whatsappAvailable}
          channel={flow.channel}
          disabled={flow.busy || seconds > 0}
          onChange={flow.setChannel}
        />
        <AppButton
          title={seconds > 0 ? `Resend in ${seconds}s` : 'Send new OTP'}
          variant="secondary"
          disabled={flow.busy || seconds > 0}
          onPress={() => void flow.sendOtp()}
        />
        <AppButton
          title="Change selection"
          variant="plain"
          disabled={flow.busy}
          onPress={flow.changeSelection}
        />
      </AppCard>
    </>
  );
}
