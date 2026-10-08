import { listParcelStorageClearancesRepo } from './parcel-storage-clearance.repository';

export async function listParcelStorageClearancesSvc(
  input: Parameters<typeof listParcelStorageClearancesRepo>[0],
) {
  return listParcelStorageClearancesRepo(input);
}
