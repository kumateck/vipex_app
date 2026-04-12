import { useParams } from 'react-router-dom';
import { FleetShiftRostersCreatePage } from './fleet-shift-rosters-create-page';
import { FleetShiftRostersEditPage } from './fleet-shift-rosters-edit-page';

export function FleetShiftRostersCreateEditPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <FleetShiftRostersEditPage /> : <FleetShiftRostersCreatePage />;
}
