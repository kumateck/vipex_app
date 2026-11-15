import { Text } from 'react-native';
import {
  AppButton,
  AppCard,
  AppInput,
  AppLabel,
  AppSelectField,
} from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { MAX_BATCH_PARCELS } from '@/shared/shipments/parcel-batch-handover';
import { formatBatchAmount } from '@/features/operations/parcel-batch-handover/utils';
import type { useMobileBatchHandover } from '../../hooks';
import { MobileBatchChannel } from './mobile-batch-channel';
import { MobileBatchSearchResults } from './mobile-batch-search-results';

export function MobileBatchSelection({
  flow,
  whatsappAvailable,
}: {
  flow: ReturnType<typeof useMobileBatchHandover>;
  whatsappAvailable: boolean;
}) {
  const { theme } = useAppearance();
  return (
    <>
      <AppCard>
        <AppLabel>Receiver telephone</AppLabel>
        <AppInput
          accessibilityLabel="Receiver telephone"
          keyboardType="phone-pad"
          maxLength={40}
          value={flow.draft}
          onChangeText={flow.setDraft}
          editable={!flow.busy}
          returnKeyType="search"
          onSubmitEditing={() => void flow.search()}
        />
        <AppButton
          title="Find parcels"
          disabled={!flow.draft.trim() || flow.busy}
          onPress={() => void flow.search()}
        />
      </AppCard>
      <MobileBatchSearchResults flow={flow} />
      {flow.page?.rows.length ? (
        <AppCard>
          <Text style={{ color: theme.colors.text }}>
            {flow.selected.length} selected · Choose 2–{MAX_BATCH_PARCELS} parcels
            {flow.totalPsw > 0 ? ` · Amount due ${formatBatchAmount(flow.totalPsw)}` : ''}
          </Text>
          {flow.needsAssociate ? (
            <AppSelectField
              label="Parcel associate for unassigned parcels"
              value={flow.associateId}
              options={flow.page.staff.map(({ id, name }) => ({ value: id, label: name }))}
              onValueChange={flow.setAssociateId}
              disabled={flow.busy}
            />
          ) : null}
          {flow.needsAssociate && !flow.page.staff.length ? (
            <Text style={{ color: theme.colors.danger }}>
              No active staff available for this selection.
            </Text>
          ) : null}
          {flow.selected.length >= 2 ? (
            <MobileBatchChannel
              available={whatsappAvailable}
              channel={flow.channel}
              disabled={flow.busy}
              onChange={flow.setChannel}
            />
          ) : null}
          <AppButton
            title="Send one OTP"
            disabled={flow.busy || !flow.readyToSend}
            onPress={() => void flow.sendOtp()}
          />
        </AppCard>
      ) : null}
    </>
  );
}
