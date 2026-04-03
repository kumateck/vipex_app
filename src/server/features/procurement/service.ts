import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  ProcurementRequestStatus,
  procurementPurchaseRequests,
  procurementSuppliers,
} from '@/db/schemas';
import {
  createProcurementSupplierRepo,
  createPurchaseRequestRepo,
  findSupplierByNameRepo,
  getPurchaseRequestByIdRepo,
  listProcurementSupplierOptionsRepo,
  listProcurementSuppliersRepo,
  listPurchaseRequestsRepo,
  updateProcurementSupplierRepo,
  updatePurchaseRequestStatusRepo,
  type ListPurchaseRequestsParams,
  type ListSuppliersParams,
} from './repository';

function buildRequestNo() {
  return `PR-${Date.now().toString(36).toUpperCase()}`;
}

export async function listProcurementSuppliersSvc(params: ListSuppliersParams) {
  return listProcurementSuppliersRepo(params);
}

export async function listProcurementSupplierOptionsSvc(input: {
  companyId: string;
  search?: string | null;
  isActive?: boolean | null;
}) {
  return listProcurementSupplierOptionsRepo(input);
}

export async function createProcurementSupplierSvc(input: {
  companyId: string;
  createdBy: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  telephone?: string | null;
  address?: string | null;
}) {
  const exists = await findSupplierByNameRepo(input.companyId, input.name);
  if (exists) throw Conflict('Supplier with this name already exists');

  const created = await createProcurementSupplierRepo({
    companyId: input.companyId,
    createdBy: input.createdBy,
    name: input.name,
    contactPerson: input.contactPerson ?? null,
    email: input.email ?? null,
    telephone: input.telephone ?? null,
    address: input.address ?? null,
  });
  if (!created) throw Conflict('Failed to create supplier');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'procurement_supplier',
    entityId: created.id,
    action: 'PROCUREMENT_SUPPLIER_CREATED',
    message: `Supplier created: ${input.name}`,
  });

  return created;
}

export async function updateProcurementSupplierSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: Partial<typeof procurementSuppliers.$inferInsert>;
}) {
  const updated = await updateProcurementSupplierRepo(input.id, input.companyId, input.patch);
  if (!updated) throw NotFound('Supplier not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'procurement_supplier',
    entityId: input.id,
    action: 'PROCUREMENT_SUPPLIER_UPDATED',
    message: 'Supplier updated',
    metadata: { patch: input.patch },
  });

  return updated;
}

export async function listPurchaseRequestsSvc(params: ListPurchaseRequestsParams) {
  return listPurchaseRequestsRepo(params);
}

export async function createPurchaseRequestSvc(input: {
  companyId: string;
  requestedByUserId: string;
  branchId?: string | null;
  supplierId?: string | null;
  title: string;
  description?: string | null;
  amountPsw: number;
}) {
  const created = await createPurchaseRequestRepo({
    companyId: input.companyId,
    requestNo: buildRequestNo(),
    branchId: input.branchId ?? null,
    supplierId: input.supplierId ?? null,
    title: input.title,
    description: input.description ?? null,
    amountPsw: input.amountPsw,
    status: ProcurementRequestStatus.SUBMITTED,
    requestedByUserId: input.requestedByUserId,
  });
  if (!created) throw Conflict('Failed to create purchase request');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.requestedByUserId,
    entityType: 'procurement_purchase_request',
    entityId: created.id,
    action: 'PROCUREMENT_PURCHASE_REQUEST_CREATED',
    message: `Purchase request created: ${input.title}`,
    metadata: { amountPsw: input.amountPsw },
  });

  return created;
}

export async function approvePurchaseRequestSvc(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  const existing = await getPurchaseRequestByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Purchase request not found');
  if (existing.status !== ProcurementRequestStatus.SUBMITTED) {
    throw Conflict('Only submitted requests can be approved');
  }

  const updated = await updatePurchaseRequestStatusRepo(input.id, input.companyId, {
    status: ProcurementRequestStatus.APPROVED,
    approvedByUserId: input.approverUserId,
    approvedAt: new Date(),
    rejectedByUserId: null,
    rejectedAt: null,
    rejectionReason: null,
  } satisfies Partial<typeof procurementPurchaseRequests.$inferInsert>);

  if (!updated) throw NotFound('Purchase request not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'procurement_purchase_request',
    entityId: input.id,
    action: 'PROCUREMENT_PURCHASE_REQUEST_APPROVED',
    message: `Purchase request approved: ${existing.requestNo}`,
  });

  return updated;
}

export async function rejectPurchaseRequestSvc(input: {
  id: string;
  companyId: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  const existing = await getPurchaseRequestByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Purchase request not found');
  if (existing.status !== ProcurementRequestStatus.SUBMITTED) {
    throw Conflict('Only submitted requests can be rejected');
  }

  const updated = await updatePurchaseRequestStatusRepo(input.id, input.companyId, {
    status: ProcurementRequestStatus.REJECTED,
    rejectedByUserId: input.approverUserId,
    rejectedAt: new Date(),
    rejectionReason: input.rejectionReason,
    approvedByUserId: null,
    approvedAt: null,
  } satisfies Partial<typeof procurementPurchaseRequests.$inferInsert>);

  if (!updated) throw NotFound('Purchase request not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'procurement_purchase_request',
    entityId: input.id,
    action: 'PROCUREMENT_PURCHASE_REQUEST_REJECTED',
    message: `Purchase request rejected: ${existing.requestNo}`,
    metadata: { rejectionReason: input.rejectionReason },
  });

  return updated;
}
