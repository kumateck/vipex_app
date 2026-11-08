export const KUMASI_RECEIVING_LOCATION_ID = 'kc8wsnk8tpltz48egk7uy26s';

export type LocationRepairBranch = { id: string; name: string; company_id: string };
export type LocationRepairLocation = {
  id: string;
  name: string;
  branch_id: string;
  company_id: string;
  can_receive: boolean;
  is_deleted: boolean;
};

/** Resolve only destination pickup locations; never guess another branch's location. */
export function planMissingParcelLocations(
  companyId: string,
  branches: LocationRepairBranch[],
  locations: LocationRepairLocation[],
  kumasiLocationId = KUMASI_RECEIVING_LOCATION_ID,
) {
  return branches.map((branch) => {
    if (branch.company_id !== companyId) throw new Error('Branch belongs to another company.');
    const eligible = locations.filter(
      (location) =>
        location.company_id === companyId &&
        location.branch_id === branch.id &&
        location.can_receive &&
        !location.is_deleted,
    );
    const isKumasi = branch.name.trim().toLowerCase() === 'kumasi';
    const location = isKumasi
      ? eligible.find(
          (item) =>
            item.id === kumasiLocationId && item.name.trim().toLowerCase() === 'anloga junction',
        )
      : eligible.length === 1
        ? eligible[0]
        : undefined;
    if (!location)
      throw new Error(
        `${branch.name}: ${isKumasi ? 'the configured Anloga Junction location is unavailable' : `expected one active receiving location, found ${eligible.length}`}. No repair applied.`,
      );
    return {
      branchId: branch.id,
      branchName: branch.name,
      locationId: location.id,
      locationName: location.name,
    };
  });
}
