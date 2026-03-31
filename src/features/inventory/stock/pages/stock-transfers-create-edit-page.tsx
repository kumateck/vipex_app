import { useParams } from 'react-router-dom';
import { StockTransfersCreatePage } from './stock-transfers-create-page';
import { StockTransfersEditPage } from './stock-transfers-edit-page';

export function StockTransfersCreateEditPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <StockTransfersEditPage />;
  }

  return <StockTransfersCreatePage />;
}
