import { Text } from 'react-native';
import { AppButton, AppCard } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { ParcelHandoverNoteAction } from '@mobile/features/operations/parcel-handover-note';
import { useBatchSignatures } from '../../hooks';
import { ReceiverSignatureDialog } from '../../dialogs';

export function BatchSignatureQueue({
  branchId,
  search,
  allowed,
}: {
  branchId?: string;
  search: string;
  allowed: boolean;
}) {
  const { theme } = useAppearance();
  const state = useBatchSignatures(branchId, search, allowed);
  return (
    <>
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontWeight: '600' }}>
        Multiple-parcel signatures
      </Text>
      {state.saved ? (
        <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.success }}>
          {state.saved}
        </Text>
      ) : null}
      {state.error ? (
        <AppCard>
          <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {state.error}
          </Text>
          <AppButton title="Retry batch signatures" onPress={state.refresh} />
        </AppCard>
      ) : null}
      {!state.page && !state.error ? (
        <Text style={{ color: theme.colors.textMuted }}>Loading batch requests…</Text>
      ) : null}
      {state.page?.rows.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted }}>No matching batch signature requests.</Text>
      ) : null}
      {state.page?.rows.map((row) => (
        <AppCard key={row.requestId}>
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
            {row.parcels[0]?.receiverName} · {row.parcels.length} parcels
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {row.workflow === 'office-pickup' ? 'Waiting for Pickup' : 'Receiver Cashier'} ·{' '}
            {row.telephone}
          </Text>
          {row.parcels.map((parcel) => (
            <AppCard key={parcel.id}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                {parcel.bookingCode}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>{parcel.parcelDetails}</Text>
              <ParcelHandoverNoteAction
                parcelId={parcel.id}
                hasHandoverNote={parcel.hasHandoverNote}
                handoverNoteCritical={parcel.handoverNoteCritical}
              />
            </AppCard>
          ))}
          {row.signedAt ? (
            <Text style={{ color: theme.colors.success }}>Signed · Awaiting confirmation</Text>
          ) : (
            <AppButton
              title={`Sign for ${row.parcels.length} parcels`}
              onPress={() => state.select(row)}
            />
          )}
        </AppCard>
      ))}
      {state.hasPrevious ? (
        <AppButton
          title="First batch page"
          variant="secondary"
          onPress={() => state.changePage()}
        />
      ) : null}
      {state.page?.next ? (
        <AppButton
          title="Next batch page"
          variant="secondary"
          onPress={() => state.changePage(state.page?.next ?? undefined)}
        />
      ) : null}
      {state.selected ? (
        <ReceiverSignatureDialog
          key={state.selected.requestId}
          collector={state.selected.parcels[0]?.receiverName ?? 'Receiver'}
          trackingCode={`${state.selected.parcels.length} parcels`}
          pickup={{}}
          parcels={state.selected.parcels}
          busy={state.saving}
          error={state.saveError}
          onClose={state.close}
          onSave={(image) => void state.submit(image)}
        />
      ) : null}
    </>
  );
}
