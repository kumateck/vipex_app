import { toast } from 'sonner';
import {
  useLocationReceivingOfficesQuery,
  useSaveLocationOfficeMutation,
} from '@/features/operations/parcel-receiving-office';
import { getLocationErrorMessage } from '../utils/location-error';

export function useLocationReceivingOffices(locationId: string) {
  const { data, isLoading, isError } = useLocationReceivingOfficesQuery(locationId);
  const [saveOffice] = useSaveLocationOfficeMutation();

  async function save(name: string, officeId?: string) {
    try {
      await saveOffice({ locationId, officeId, name }).unwrap();
      toast.success(officeId ? 'Receiving office renamed' : 'Receiving office added');
      return true;
    } catch (error) {
      toast.error(getLocationErrorMessage(error, 'Could not save receiving office'));
      return false;
    }
  }

  return { data, isLoading, isError, save };
}
