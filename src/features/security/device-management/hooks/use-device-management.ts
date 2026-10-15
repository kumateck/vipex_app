import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { canApproveRegisteredDevices } from '@/shared/permissions/device-approval';
import { useAuthStore } from '@/stores/auth-store';
import {
  useListRegisteredDevicesQuery,
  useReviewRegisteredDeviceMutation,
} from '../services/device-management.api';
import type { RegisteredDevice, ReviewAction } from '../types/device-management.types';
import { countDevicesByFilter, filterDevices, type DeviceFilter } from '../utils/device-filters';

export function useDeviceManagement() {
  const user = useAuthStore((state) => state.user);
  const allowed = canApproveRegisteredDevices({
    permissions: user?.permissions,
    branchType: user?.branch?.type,
  });
  const query = useListRegisteredDevicesQuery(undefined, { skip: !allowed });
  const [filter, setFilter] = useState<DeviceFilter>('pending');
  const allDevices = useMemo(() => query.data ?? [], [query.data]);
  const devices = useMemo(() => filterDevices(allDevices, filter), [allDevices, filter]);
  const counts = useMemo(() => countDevicesByFilter(allDevices), [allDevices]);
  const [review, mutation] = useReviewRegisteredDeviceMutation();
  const [selection, setSelection] = useState<{
    device: RegisteredDevice;
    action: ReviewAction;
  } | null>(null);

  async function submit(reason: string) {
    if (!selection) return;
    try {
      await review({ id: selection.device.id, action: selection.action, reason }).unwrap();
      toast.success('Device status updated. Existing sessions were revoked where needed.');
      setSelection(null);
    } catch {
      toast.error('Could not update device. Refresh the list and try again.');
    }
  }

  return {
    allowed,
    userId: user?.id,
    devices,
    counts,
    filter,
    setFilter,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    selection,
    setSelection,
    isUpdating: mutation.isLoading,
    submit,
  };
}
