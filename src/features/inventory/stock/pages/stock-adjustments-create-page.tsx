import { StockAdjustmentForm } from '../components/stock-adjustment-form';
import { useCreateStockAdjustmentAction } from '../hooks/use-stock-actions';

export function StockAdjustmentsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateStockAdjustmentAction();

  return (
    <StockAdjustmentForm
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create stock adjustment"
      submitButtonText="Create stock adjustment"
    />
  );
}
