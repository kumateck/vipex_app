import { StockTransferForm } from '../components/stock-transfer-form';
import { useCreateStockTransferAction } from '../hooks/use-stock-actions';

export function StockTransfersCreatePage() {
  const { onSubmit, isSubmitting } = useCreateStockTransferAction();

  return (
    <StockTransferForm
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create stock transfer"
      submitButtonText="Create stock transfer"
    />
  );
}
