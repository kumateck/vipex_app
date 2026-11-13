import { useState } from 'react';
import {
  officesForPickupLocation,
  type ReceivingOfficeOption,
} from '@/shared/shipments/receiving-office';
import { useAuthStore } from '@/stores/auth-store';
import { useReceivingOfficeOptionsQuery } from '../services';

const EMPTY_OFFICES: ReceivingOfficeOption[] = [];

export function useReceivingOfficeChoice(input: {
  enabled: boolean;
  locationId?: string | null;
  allLocations?: boolean;
  initialOfficeId?: string | null;
}) {
  const scope = useAuthStore((state) => {
    const { company, branch } = state.user ?? {};
    return company?.id && branch?.id ? `${company.id}/${branch.id}` : '';
  });
  const query = useReceivingOfficeOptionsQuery(scope, {
    skip: !input.enabled || !scope,
    refetchOnMountOrArgChange: true,
  });
  const [selection, setOfficeId] = useState<string>();
  const offices = query.currentData ?? EMPTY_OFFICES;
  const options = input.allLocations
    ? offices
    : officesForPickupLocation(offices, input.locationId);
  const officeId =
    options.find((office) => office.id === (selection ?? input.initialOfficeId))?.id ?? '';
  return { ...query, options, officeId, setOfficeId };
}
