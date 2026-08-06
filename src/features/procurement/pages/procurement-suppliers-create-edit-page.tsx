import { useParams } from 'react-router-dom';
import { ProcurementSuppliersCreatePage } from './procurement-suppliers-create-page';
import { ProcurementSuppliersEditPage } from './procurement-suppliers-edit-page';

export function ProcurementSuppliersCreateEditPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <ProcurementSuppliersEditPage /> : <ProcurementSuppliersCreatePage />;
}
