import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { StockMaintenanceForm } from '../components/stock-maintenance-form';
import { useCreateStockMaintenanceAction } from '../hooks/use-stock-actions';

export function StockMaintenanceCreatePage() {
  const { onSubmit, isSubmitting } = useCreateStockMaintenanceAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <StockMaintenanceForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </div>
    </ScrollableWrapper>
  );
}
