import { useParams } from 'react-router-dom';
import { ProcurementFleetPoliciesCreatePage } from './procurement-fleet-policies-create-page';
import { ProcurementFleetPoliciesEditPage } from './procurement-fleet-policies-edit-page';

export function ProcurementFleetPoliciesCreateEditPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <ProcurementFleetPoliciesEditPage /> : <ProcurementFleetPoliciesCreatePage />;
}
