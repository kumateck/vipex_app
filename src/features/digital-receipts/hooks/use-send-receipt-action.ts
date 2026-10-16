import { useCallback, useState } from 'react';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { useDigitalReceiptsModule } from './use-digital-receipts-module';

const RECEIPT_PERMISSIONS = [
  PermissionKeys.CanCreateParcels,
  PermissionKeys.CanCreateSenderPayments,
  PermissionKeys.CanCreateReceiverPayments,
  PermissionKeys.CanCompleteOfficePickup,
  PermissionKeys.CanDispatchForDelivery,
  PermissionKeys.CanReadParcels,
];

export function useSendReceiptAction(isDeleted: boolean) {
  const { isDigitalReceiptsEnabled } = useDigitalReceiptsModule();
  const canSend = useAuthStore((state) =>
    RECEIPT_PERMISSIONS.some((permission) => state.user?.permissions.includes(permission)),
  );
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isVisible: isDigitalReceiptsEnabled && canSend && !isDeleted, isOpen, open, close };
}
