import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { StockRequestForm } from '../components/stock-request-form';
import { useCreateStockRequestAction } from '../hooks/use-stock-actions';

export function StockRequestsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateStockRequestAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <StockRequestForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </div>
    </ScrollableWrapper>
  );
}
