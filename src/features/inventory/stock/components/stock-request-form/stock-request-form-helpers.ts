import { InventoryLocationType, StockRequestType } from '@/db/schemas/enums';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import type { InventoryLocationOption } from '@/features/inventory/locations/api/inventory-locations.api';

export function toLocationOption(location: InventoryLocationOption): SearchableSelectOption {
  return {
    value: location.id,
    label: location.name,
    searchText: `${location.name} ${location.branchId}`,
  };
}

function sortLocations(locations: InventoryLocationOption[]) {
  return [...locations].sort((a, b) => a.name.localeCompare(b.name));
}

export function getRequesterLocations(input: {
  locations: InventoryLocationOption[];
  requestType: StockRequestType;
  isHeadOffice: boolean;
  userBranchId: string | null;
}) {
  const scopedByBranch =
    input.isHeadOffice || !input.userBranchId
      ? input.locations
      : input.locations.filter((location) => location.branchId === input.userBranchId);

  const filteredByType = scopedByBranch.filter((location) => {
    if (input.requestType === StockRequestType.INTER_BRANCH) {
      return location.locationType === InventoryLocationType.BRANCH_STORE;
    }
    return location.locationType === InventoryLocationType.CONSUMPTION_LOCATION;
  });

  return sortLocations(filteredByType);
}

export function getRequestedToLocations(input: {
  locations: InventoryLocationOption[];
  requestType: StockRequestType;
  requesterLocationId: string;
  isHeadOffice: boolean;
  userBranchId: string | null;
}) {
  const filteredByType = input.locations.filter((location) => {
    if (input.requestType === StockRequestType.INTER_BRANCH) {
      return (
        location.locationType === InventoryLocationType.MAIN_STORE ||
        location.locationType === InventoryLocationType.BRANCH_STORE
      );
    }

    return (
      location.locationType === InventoryLocationType.BRANCH_STORE ||
      location.locationType === InventoryLocationType.CONSUMPTION_LOCATION
    );
  });

  const scopedByBranch =
    input.requestType === StockRequestType.INTRA_BRANCH && !input.isHeadOffice && input.userBranchId
      ? filteredByType.filter((location) => location.branchId === input.userBranchId)
      : filteredByType;

  const withoutRequester = scopedByBranch.filter(
    (location) => location.id !== input.requesterLocationId,
  );

  return sortLocations(withoutRequester);
}

export function getRequestTypeLabel(value: StockRequestType) {
  return value === StockRequestType.INTER_BRANCH ? 'Inter branch' : 'Intra branch';
}
