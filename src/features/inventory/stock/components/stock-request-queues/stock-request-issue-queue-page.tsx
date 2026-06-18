import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { StockRequestQueueTable } from './stock-request-queue-table';

export function StockRequestIssueQueuePage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <StockRequestQueueTable mode="issue" />
      </div>
    </ScrollableWrapper>
  );
}
