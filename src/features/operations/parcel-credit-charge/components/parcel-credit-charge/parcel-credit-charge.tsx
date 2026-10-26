import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import { CreditChargeDialog } from '../../dialogs';
import type { CreditChargeProps } from '../../types';

export function ParcelCreditChargeAction(props: CreditChargeProps) {
  if (props.chargePsw !== 0) return null;
  return (
    <PermissionGuard permissionKey={PermissionKeys.CanUpdateParcelCharge}>
      <CreditChargeDialog {...props} />
    </PermissionGuard>
  );
}
