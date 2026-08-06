import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { StockRequestQueueTable } from './stock-request-queue-table';

export function StockRequestAcknowledgeQueuePage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <StockRequestQueueTable mode="acknowledge" />
      </div>
    </ScrollableWrapper>
  );
}
