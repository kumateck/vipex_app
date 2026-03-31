import { StockMovementForm } from '../components/stock-movement-form';
import { useCreateStockMovementAction } from '../hooks/use-stock-actions';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function StockMovementsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateStockMovementAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <StockMovementForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Create stock movement"
          submitButtonText="Create stock movement"
        />
      </div>
    </ScrollableWrapper>
  );
}
