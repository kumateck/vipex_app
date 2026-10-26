import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import { CreditChargeDialog } from '../../dialogs';
import type { CreditChargeProps } from '../../types';

export function ParcelCreditChargeAction(props: CreditChargeProps) {
  return (
    <PermissionGuard permissionKey={PermissionKeys.CanUpdateParcels}>
      <CreditChargeDialog {...props} />
    </PermissionGuard>
  );
}
