import { StockTransferForm } from '../components/stock-transfer-form';
import { useCreateStockTransferAction } from '../hooks/use-stock-actions';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function StockTransfersCreatePage() {
  const { onSubmit, isSubmitting } = useCreateStockTransferAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <StockTransferForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Create stock transfer"
          submitButtonText="Create stock transfer"
        />
      </div>
    </ScrollableWrapper>
  );
}
