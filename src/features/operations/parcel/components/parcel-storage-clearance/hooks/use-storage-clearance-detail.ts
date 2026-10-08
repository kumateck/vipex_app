import { useGetParcelStorageClearanceDetailQuery } from '../services';
export function useStorageClearanceDetail(id: string) {
  return useGetParcelStorageClearanceDetailQuery(id);
}
