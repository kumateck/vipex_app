import { useAuthStore } from '@/stores/auth-store';
import { PermissionKeys } from '@/shared/permissions/constants';

export function useShelfPickupReassignmentAccess() {
  return useAuthStore(
    (state) => state.user?.permissions.includes(PermissionKeys.CanUpdateParcelShelfPicker) ?? false,
  );
}
