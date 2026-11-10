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
import { canCaptureReceiverSignature } from '@mobile/lib/permissions';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import { ReceiverSignatureDialog } from '../../dialogs';
import { useReceiverSignatures } from '../../hooks';

export function ReceiverSignaturesScreen() {
  const { session } = useAuth();
  const { theme } = useAppearance();
  const branchId = session.user?.branch?.id;
  const allowed = canCaptureReceiverSignature(session.user?.permissions);
  const signatures = useReceiverSignatures(branchId, allowed);
  const [search, setSearch] = useState('');
  const { page, selected } = signatures;

  if (!allowed || !branchId) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="Receiver Cashier permission and an assigned branch are required." />
      </AppScreen>
    );
  }

  return (
    <AppScreen keyboardShouldPersistTaps="handled">
      <AppPageHeader
        title="Receiver Signatures"
        subtitle="Capture the customer’s signature for a parcel processed at Receiver Cashier."
      />
      <AppCard>
        <AppInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tracking, booking, or collector name"
          accessibilityLabel="Search receiver signatures"
          maxLength={100}
          returnKeyType="search"
          onSubmitEditing={() => signatures.search(search)}
        />
        <AppButton title="Search" variant="secondary" onPress={() => signatures.search(search)} />
      </AppCard>
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
      ) : !page ? (
        <Text style={{ color: theme.colors.textMuted }}>Loading signatures…</Text>
      ) : null}
      {page?.rows.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted }}>No matching parcels at this branch.</Text>
      ) : null}
      {page?.rows.map((row) => (
        <AppCard key={row.handoverId}>
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
            {row.trackingCode} · {row.bookingCode}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {row.collectorName} · Associate: {row.associateName}
          </Text>
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
          busy={signatures.saving}
          error={signatures.saveError}
          onClose={signatures.close}
          onSave={(image) => void signatures.submit(image)}
        />
      ) : null}
    </AppScreen>
  );
}
