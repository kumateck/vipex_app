import { StockAdjustmentForm } from '../components/stock-adjustment-form';
import { useCreateStockAdjustmentAction } from '../hooks/use-stock-actions';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function StockAdjustmentsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateStockAdjustmentAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <StockAdjustmentForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Create stock adjustment"
          submitButtonText="Create stock adjustment"
        />
      </div>
    </ScrollableWrapper>
  );
}
