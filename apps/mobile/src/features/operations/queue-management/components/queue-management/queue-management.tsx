import { AppScreen } from '@mobile/components/screen';
import { MobileNoAccess } from '@mobile/components/ui';
import { useQueueManagement } from '../../hooks/use-queue-management';
import { QueueBoardSection } from './queue-board-section';
import { QueueDetailsCard } from './queue-details-card';
import { QueueHeader } from './queue-header';
import { QueueOverview } from './queue-overview';
import { QueueResultsSection } from './queue-results-section';
import { QueueSearchPanel } from './queue-search-panel';

export function QueueManagement() {
  const queue = useQueueManagement();
  if (!queue.access.canView) {
    return (
      <AppScreen scrollable={false}>
        <QueueHeader branchName={queue.branchName} />
        <MobileNoAccess message="You do not have permission to access queue operations." />
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={queue.loadingBoards} onRefresh={() => void queue.refreshBoards()}>
      <QueueHeader branchName={queue.branchName} />
      <QueueOverview
        receiverCount={queue.receiverQueueCards.length}
        waitingCount={queue.waitingPickupQueueCards.length}
      />
      <QueueSearchPanel
        search={queue.search}
        loading={queue.loading}
        loadingBoards={queue.loadingBoards}
        canSearch={queue.access.canReadParcels}
        onChangeSearch={queue.setSearch}
        onSearch={() => void queue.runSearch()}
        onRefresh={() => void queue.refreshBoards()}
      />
      <QueueResultsSection
        canSearch={queue.access.canReadParcels}
        hasSearch={queue.search.trim().length > 0}
        loading={queue.loading}
        rows={queue.rows}
        onSelect={(parcel) => void queue.selectParcel(parcel)}
      />
      {queue.selectedParcel && queue.access.canReadParcels ? (
        <QueueDetailsCard
          parcel={queue.selectedParcel}
          details={queue.selectedDetails}
          canIssueQueue={queue.canIssueSelectedQueue}
          canIssueTicket={queue.access.canIssueTicket}
          issuing={queue.queueingParcelId === queue.selectedParcel.id}
          onIssue={() => void queue.issueSelectedTicket()}
          onClose={queue.closeDetails}
        />
      ) : null}
      {queue.access.canReadReceiverBoard ? (
        <QueueBoardSection
          title="Receiver queue"
          subtitle="To-pay parcels ready for pickup"
          emptyMessage="No active receiver queue tickets right now."
          cards={queue.receiverQueueCards}
          loading={queue.loadingBoards}
          onCopy={queue.copyQueueCode}
          onShare={(card) => void queue.shareQueueCard(card)}
        />
      ) : null}
      {queue.access.canReadSenderBoard ? (
        <QueueBoardSection
          title="Waiting pickup"
          subtitle="Sender-paid parcels awaiting collection"
          emptyMessage="No sender-paid parcels are waiting for pickup."
          cards={queue.waitingPickupQueueCards}
          loading={queue.loadingBoards}
          onCopy={queue.copyQueueCode}
          onShare={(card) => void queue.shareQueueCard(card)}
        />
      ) : null}
    </AppScreen>
  );
}
