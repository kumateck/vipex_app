import { useState } from 'react';
import { toast } from 'sonner';
import { BranchType } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useListRegisteredDevicesQuery,
  useReviewRegisteredDeviceMutation,
} from '../services/device-management.api';
import type { RegisteredDevice, ReviewAction } from '../types/device-management.types';

export function useDeviceManagement() {
  const user = useAuthStore((state) => state.user);
  const allowed =
    user?.branch?.type === BranchType.HEADOFFICE &&
    user.permissions?.includes(PermissionKeys.CanUpdateUsers);
  const query = useListRegisteredDevicesQuery(undefined, { skip: !allowed });
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
    devices: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    selection,
    setSelection,
    isUpdating: mutation.isLoading,
    submit,
  };
}
