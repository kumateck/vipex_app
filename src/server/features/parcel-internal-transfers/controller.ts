import {
  acknowledgeParcelInternalTransferSvc,
  cancelParcelInternalTransferSvc,
  createParcelInternalTransferSvc,
  getParcelInternalTransferDetailsSvc,
  listParcelInternalTransfersSvc,
} from './service';

function toIso(value?: Date | string | null) {
  if (!value) return null;
  return typeof value === 'string' ? value : value.toISOString();
}

export const createParcelInternalTransferCtrl = createParcelInternalTransferSvc;
export const acknowledgeParcelInternalTransferCtrl = acknowledgeParcelInternalTransferSvc;
export const cancelParcelInternalTransferCtrl = cancelParcelInternalTransferSvc;

export async function listParcelInternalTransfersCtrl(input: {
  companyId: string;
  branchId?: string | null;
  status?: number | null;
  destinationLocationId?: string | null;
  destinationWarehouseId?: string | null;
  sourceLocationId?: string | null;
  sourceWarehouseId?: string | null;
}) {
  const rows = await listParcelInternalTransfersSvc(input);
  return rows.map((row) => ({
    ...row,
    transferredAt: toIso(row.transferredAt),
    acknowledgedAt: toIso(row.acknowledgedAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }));
}

export async function getParcelInternalTransferDetailsCtrl(id: string, companyId: string) {
  const { transfer, items } = await getParcelInternalTransferDetailsSvc(id, companyId);
  return {
    transfer: {
      ...transfer,
      transferredAt: toIso(transfer.transferredAt),
      acknowledgedAt: toIso(transfer.acknowledgedAt),
      cancelledAt: toIso(transfer.cancelledAt),
      createdAt: toIso(transfer.createdAt),
      updatedAt: toIso(transfer.updatedAt),
    },
    items: items.map((item) => ({
      ...item,
      addedAt: toIso(item.addedAt),
    })),
  };
}
