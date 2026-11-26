import { PickupOfficeText } from '@mobile/features/operations/parcel-receiving-office';
import { ParcelHandoverNoteAction } from '@mobile/features/operations/parcel-handover-note';
import { useState } from 'react';
import { Text } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import {
  AppButton,
  AppCard,
  AppInput,
  AppPageHeader,
  MobileNoAccess,
} from '@mobile/components/ui/mobile';
import { canCaptureReceiverSignature, canViewReceiverSignatures } from '@mobile/lib/permissions';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import { ReceiverSignatureDialog } from '../../dialogs';
import { useReceiverSignatures } from '../../hooks';
import { BatchSignatureQueue } from './batch-signature-queue';

export function ReceiverSignaturesScreen() {
  const { session } = useAuth();
  const { theme } = useAppearance();
  const branchId = session.user?.branch?.id;
  const allowed = canViewReceiverSignatures(session.user?.permissions);
  const cashierAllowed = canCaptureReceiverSignature(session.user?.permissions);
  const signatures = useReceiverSignatures(branchId, cashierAllowed);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const submitSearch = () => {
    signatures.search(search);
    setSubmittedSearch(search.trim());
  };
  const { page, selected } = signatures;

  if (!allowed || !branchId) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="Receiver Cashier or Waiting for Pickup permission and an assigned branch are required." />
      </AppScreen>
    );
  }

  return (
    <AppScreen keyboardShouldPersistTaps="handled">
      <AppPageHeader
        title="Receiver Signatures"
        subtitle="Capture one signature for the parcel or list requested by the handover operator."
      />
      <AppCard>
        <AppInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tracking, booking, or collector name"
          accessibilityLabel="Search receiver signatures"
          maxLength={100}
          returnKeyType="search"
          onSubmitEditing={submitSearch}
        />
        <AppButton title="Search" variant="secondary" onPress={submitSearch} />
      </AppCard>
      <BatchSignatureQueue
        key={branchId}
        branchId={branchId}
        search={submittedSearch}
        allowed={allowed}
      />
      {cashierAllowed ? (
        <Text accessibilityRole="header" style={{ color: theme.colors.text, fontWeight: '600' }}>
          Single-parcel signatures
        </Text>
      ) : null}
      {signatures.saved ? (
        <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.success }}>
          {signatures.saved}
        </Text>
      ) : null}
      {signatures.loadError ? (
        <AppCard>
          <Text style={{ color: theme.colors.danger }}>{signatures.loadError}</Text>
          <AppButton title="Retry" variant="secondary" onPress={signatures.refresh} />
        </AppCard>
      ) : cashierAllowed && !page ? (
        <Text style={{ color: theme.colors.textMuted }}>Loading signatures…</Text>
      ) : null}
      {page?.rows.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted }}>No matching parcels at this branch.</Text>
      ) : null}
      {page?.rows.map((row) => (
        <AppCard key={row.handoverId}>
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{row.bookingCode}</Text>
          <Text style={{ color: theme.colors.text }}>
            {row.receiverName || 'Receiver'}
            {row.receiverTelephone ? ` · ${row.receiverTelephone}` : ''}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>{row.parcelDetails}</Text>
          <ParcelHandoverNoteAction
            parcelId={row.id}
            hasHandoverNote={row.hasHandoverNote}
            handoverNoteCritical={row.handoverNoteCritical}
          />
          <Text style={{ color: theme.colors.textMuted }}>
            Collector: {row.collectorName} · Associate: {row.associateName}
          </Text>
          <PickupOfficeText
            location={row.pickupLocationName}
            office={row.receivingOfficeName}
            style={{ color: theme.colors.textMuted }}
          />
          {row.signedAt ? (
            <Text style={{ color: theme.colors.success }}>
              Signed · Awaiting desktop confirmation
            </Text>
          ) : (
            <AppButton title="Capture signature" onPress={() => signatures.select(row)} />
          )}
        </AppCard>
      ))}
      {signatures.hasPrevious ? (
        <AppButton title="First page" variant="secondary" onPress={signatures.firstPage} />
      ) : null}
      {page?.next ? (
        <AppButton
          title="Next page"
          variant="secondary"
          onPress={() => page.next && signatures.nextPage(page.next)}
        />
      ) : null}
      {selected ? (
        <ReceiverSignatureDialog
          key={selected.handoverId}
          collector={selected.collectorName}
          trackingCode={selected.trackingCode}
          pickup={selected}
          busy={signatures.saving}
          error={signatures.saveError}
          onClose={signatures.close}
          onSave={(image) => void signatures.submit(image)}
        />
      ) : null}
    </AppScreen>
  );
}
