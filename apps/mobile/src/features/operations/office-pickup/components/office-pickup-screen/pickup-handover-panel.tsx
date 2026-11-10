import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { AppButton, AppCard, AppSelectField, AppSkeletonCard } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { OfficePickupHandover } from '../../hooks';
import type { PickupContext } from '../../types';
import { PickupCardFields } from './pickup-card-fields';
import { PickupCollectorFields } from './pickup-collector-fields';
import { PickupOtpSection } from './pickup-otp-section';
import { PickupSignatureSection } from './pickup-signature-section';
import { PickupQueueNotice, PickupSummaryCard } from './pickup-summary-card';
import { pickupStyles } from './office-pickup.styles';

type Props = {
  handover: OfficePickupHandover;
  context: PickupContext;
  isPickupOtpRequired: boolean;
  isPickupQueueEnabled: boolean;
  isWhatsAppAvailable: boolean;
};

export function PickupHandoverPanel(props: Props) {
  const { handover, context, isPickupOtpRequired, isPickupQueueEnabled } = props;
  const { parcel, resources, form, saving } = handover;
  const { theme } = useAppearance();
  const staffOptions = useMemo(
    () =>
      (resources?.staffOptions ?? []).map((staff) => ({ value: staff.id, label: staff.fullname })),
    [resources?.staffOptions],
  );
  if (!parcel) return null;
  const back = (
    <AppButton title="Back to parcels" variant="plain" onPress={handover.close} disabled={saving} />
  );

  if (handover.loading) return <AppSkeletonCard lines={5} />;
  if (handover.loadError || !resources) {
    return (
      <>
        <AppCard>
          <Text style={[pickupStyles.title, { color: theme.colors.text }]}>
            Unable to load pickup details
          </Text>
          <AppButton title="Try again" variant="secondary" onPress={() => void handover.retry()} />
        </AppCard>
        {back}
      </>
    );
  }

  const assignedPicker = Boolean(
    resources.details.parcel.shelfPickerStaffId || resources.details.pickupQueue?.pickerStaffId,
  );
  const muted = { color: theme.colors.textMuted };
  const collector = form.handoverTarget === 'second' ? 'Second receiver' : 'Main receiver';

  return (
    <>
      <PickupSummaryCard parcel={parcel} />
      {isPickupQueueEnabled ? <PickupQueueNotice queue={resources.details.pickupQueue} /> : null}
      <AppCard>
        <AppSelectField
          label="Shelf picker staff"
          value={form.pickerStaffId}
          options={staffOptions}
          disabled={saving || assignedPicker}
          placeholder="Select staff"
          onValueChange={form.setPickerStaffId}
        />
        <Text style={[pickupStyles.hint, muted]}>
          {context.locationName
            ? `Only active staff assigned to ${context.locationName} are shown.`
            : 'Your user account needs an assigned location before staff can be selected.'}
        </Text>
        <PickupCardFields
          label="Main receiver ID card"
          value={form.mainCard}
          onChange={form.setMainCard}
          receiverCards={resources.mainReceiverCards}
          cardOptions={resources.cardOptions}
          disabled={saving}
        />
      </AppCard>
      <PickupCollectorFields
        form={form}
        hasLinkedSecondReceiver={Boolean(parcel.secondReceiverId)}
        secondReceiverCards={resources.secondReceiverCards}
        cardOptions={resources.cardOptions}
        disabled={saving}
      />
      {isPickupOtpRequired ? (
        <PickupOtpSection
          otp={handover.otp}
          receiverPhone={parcel.receiverPhone}
          receiverPhone2={parcel.receiverPhone2}
          phoneSlot={handover.phoneSlot}
          onPhoneSlotChange={handover.setPhoneSlot}
          isWhatsAppAvailable={props.isWhatsAppAvailable}
          disabled={saving}
        />
      ) : (
        <View style={[pickupStyles.notice, { borderColor: theme.colors.warning }]}>
          <Text style={[pickupStyles.text, pickupStyles.strong, { color: theme.colors.text }]}>
            Pickup OTP is disabled for this branch
          </Text>
          <Text style={[pickupStyles.hint, muted]}>
            Continue without OTP only when processing an approved legacy record.
          </Text>
        </View>
      )}
      <PickupSignatureSection
        collector={collector}
        signed={Boolean(form.signatureImage)}
        disabled={saving}
        onSign={form.setSignatureImage}
      />
      <AppButton
        title={saving ? 'Processing…' : 'Confirm delivered'}
        loading={saving}
        disabled={saving || Boolean(handover.confirmBlocker)}
        onPress={() => void handover.confirm()}
      />
      {handover.confirmBlocker ? (
        <Text style={[pickupStyles.hint, muted]}>{handover.confirmBlocker}</Text>
      ) : null}
      <AppButton
        title="Request home delivery"
        variant="secondary"
        disabled={saving}
        onPress={() => void handover.requestHomeDelivery()}
      />
      {back}
    </>
  );
}
