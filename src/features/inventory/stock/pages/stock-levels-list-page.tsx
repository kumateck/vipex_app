import { StockLevelsTable } from '../components/stock-levels-table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function StockLevelsListPage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <StockLevelsTable />
      </div>
    </ScrollableWrapper>
  );
}
