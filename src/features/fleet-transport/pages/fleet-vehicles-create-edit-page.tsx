import { useParams } from 'react-router-dom';
import { FleetVehiclesCreatePage } from './fleet-vehicles-create-page';
import { FleetVehiclesEditPage } from './fleet-vehicles-edit-page';

export function FleetVehiclesCreateEditPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <FleetVehiclesEditPage /> : <FleetVehiclesCreatePage />;
}
