import { Text } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import {
  AppButton,
  AppPageHeader,
  AppSkeletonCard,
  MobileNoAccess,
} from '@mobile/components/ui/mobile';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import {
  canCompleteSelfServiceBookings,
  canViewSelfServiceBookings,
} from '@mobile/lib/permissions';
import { useSelfServiceAgent } from '../../hooks';
import { SelfServiceCompletionForm } from './self-service-completion-form';
import { SelfServiceDraftCard } from './self-service-draft-card';
import { SelfServiceDraftsSearch } from './self-service-drafts-search';
import { SelfServiceCompletedBooking } from './self-service-completed-booking';

export function SelfServiceAgentScreen() {
  const { session } = useAuth();
  const { theme } = useAppearance();
  const permissions = session.user?.permissions ?? [];
  const canRead = canViewSelfServiceBookings(permissions);
  const canComplete = canCompleteSelfServiceBookings(permissions);
  const workflow = useSelfServiceAgent(canRead, canComplete);

  if (!canRead)
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to view self-service bookings." />
      </AppScreen>
    );

  return (
    <AppScreen>
      <AppPageHeader
        title="Self-Service Bookings"
        subtitle="Claim customer drafts and complete them into authoritative parcel bookings."
        rightSlot={
          <AppButton title="Refresh" variant="plain" onPress={() => void workflow.load()} />
        }
      />
      {workflow.completedBooking ? (
        <SelfServiceCompletedBooking
          completed={workflow.completedBooking}
          onDone={workflow.dismissCompletedBooking}
        />
      ) : workflow.selected ? (
        <SelfServiceCompletionForm
          key={workflow.selected.id}
          draft={workflow.selected}
          saving={workflow.saving}
          canComplete={canComplete}
          onBack={() => workflow.setSelected(null)}
          onClaim={workflow.claim}
          onComplete={workflow.complete}
          onUpdateDraft={workflow.updateDraft}
        />
      ) : (
        <>
          <SelfServiceDraftsSearch value={workflow.search} onChange={workflow.setSearch} />
          {workflow.loading ? (
            <>
              <AppSkeletonCard />
              <AppSkeletonCard />
            </>
          ) : workflow.visibleDrafts.length ? (
            workflow.visibleDrafts.map((draft) => (
              <SelfServiceDraftCard
                key={draft.id}
                draft={draft}
                disabled={workflow.saving}
                opening={workflow.openingDraftId === draft.id}
                onPress={() => void workflow.open(draft)}
              />
            ))
          ) : (
            <Text style={{ color: theme.colors.textSubtle }}>
              {workflow.drafts.length
                ? 'No self-service bookings match your search.'
                : 'No pending self-service bookings for your branch.'}
            </Text>
          )}
        </>
      )}
    </AppScreen>
  );
}
