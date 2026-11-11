import { Text, View } from 'react-native';
import { AppButton, AppInput, AppPageHeader, MobileNoAccess } from '@mobile/components/ui/mobile';
import { AppScreen } from '@mobile/components/screen';
import { ParcelCard } from '@mobile/components/courier';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useNoteQueue } from '../../hooks';
import type { NoteQueue } from '../../services';

const queueDetails = {
  'call-center': {
    title: 'Call Center Assignment',
    permission: PermissionKeys.CanReadCallCenterAssignment,
  },
  'shelf-picker': {
    title: 'Shelf Picker Update',
    permission: PermissionKeys.CanReadShelfPickerUpdate,
  },
  'receiver-cashier-queue': {
    title: 'Receiver Cashier',
    permission: PermissionKeys.CanCreateReceiverPayments,
  },
} satisfies Record<NoteQueue, { title: string; permission: string }>;

export function ParcelNoteQueueScreen({ queue }: { queue: NoteQueue }) {
  const { session } = useAuth();
  const { theme } = useAppearance();
  const { permission, title } = queueDetails[queue];
  const allowed = Boolean(session.user?.permissions?.includes(permission));
  const state = useNoteQueue(queue, allowed);
  if (!allowed)
    return (
      <AppScreen>
        <MobileNoAccess message="This parcel workflow requires permission." />
      </AppScreen>
    );
  return (
    <AppScreen refreshing={state.loading} onRefresh={state.refresh}>
      <AppPageHeader
        title={title}
        subtitle="Search parcels in this workflow and review their handover notes."
      />
      <AppInput
        accessibilityLabel="Parcel search"
        placeholder="Booking, tracking, name or phone"
        value={state.draft}
        onChangeText={state.setDraft}
        onSubmitEditing={state.search}
      />
      <AppButton title="Search" onPress={state.search} loading={state.loading} />
      {state.error ? (
        <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          {state.error}
        </Text>
      ) : null}
      {!state.loading && !state.error && state.result?.data.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted }}>No matching parcels.</Text>
      ) : null}
      {state.result?.data.map((parcel) => (
        <ParcelCard key={parcel.id} parcel={parcel} />
      ))}
      {state.query.page > 1 || state.result?.meta.hasNextPage ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <AppButton
            title="Previous"
            variant="secondary"
            disabled={state.loading || state.query.page <= 1}
            onPress={() => state.changePage(state.query.page - 1)}
          />
          <AppButton
            title="Next"
            variant="secondary"
            disabled={state.loading || !state.result?.meta.hasNextPage}
            onPress={() => state.changePage(state.query.page + 1)}
          />
        </View>
      ) : null}
    </AppScreen>
  );
}
