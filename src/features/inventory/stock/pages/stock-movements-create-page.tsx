import { StockMovementForm } from '../components/stock-movement-form';
import { useCreateStockMovementAction } from '../hooks/use-stock-actions';

export function StockMovementsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateStockMovementAction();

  return (
    <StockMovementForm
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create stock movement"
      submitButtonText="Create stock movement"
    />
  );
}
