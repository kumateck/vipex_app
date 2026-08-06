import { db } from '@/db/config';
import { recordAuditLog } from '../audit/logger';
import {
  deleteStoredObject,
  getStoredObjectResponse,
  uploadImageDataUrl,
} from '@/server/services/storage/minio';
import { BadRequest, NotFound } from '@/server/utils/http-error';
import { logger as devLogger } from '@/server/utils/logger';
import { createUploadRepo, deleteUploadRepo, getUploadRepo, listUploadsRepo } from './repository';

export const UPLOAD_MODEL_TYPES = [
  'customer-card-front-image',
  'customer-card-back-image',
  'employee-profile-image',
  'delivery-handover-signature',
  'it-support-ticket',
  'parcel-reconciliation-evidence',
] as const;

function normalizeModelSegment(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-');
  return normalized.replace(/^-+|-+$/g, '');
}

export async function listUploadModelTypesSvc() {
  return [...UPLOAD_MODEL_TYPES];
}

export async function createUploadSvc(input: {
  companyId: string;
  uploadedBy: string;
  modelType: string;
  modelId: string;
  fileName: string;
  dataUrl: string;
}) {
  const modelType = normalizeModelSegment(input.modelType);
  const modelId = input.modelId.trim();
  const fileName = input.fileName.trim();
  if (!modelType) throw BadRequest('modelType is required');
  if (!modelId) throw BadRequest('modelId is required');
  if (!fileName) throw BadRequest('fileName is required');

  devLogger.info('[uploads] createUploadSvc:start', {
    companyId: input.companyId,
    uploadedBy: input.uploadedBy,
    modelType,
    modelId,
    fileName,
    dataUrlLength: input.dataUrl.length,
  });

  try {
    const stored = await uploadImageDataUrl({
      folder: `${modelType}/${modelId}`,
      dataUrl: input.dataUrl,
      fileName,
    });
    devLogger.info('[uploads] storage:uploaded', {
      objectKey: stored.key,
      contentType: stored.contentType,
      sizeBytes: stored.size,
    });

    const created = await createUploadRepo({
      companyId: input.companyId,
      modelType,
      modelId,
      fileName,
      contentType: stored.contentType,
      objectKey: stored.key,
      fileUrl: stored.url,
      sizeBytes: stored.size,
      uploadedBy: input.uploadedBy,
    });
    if (!created) throw BadRequest('Failed to create upload');

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.uploadedBy,
      entityType: 'upload',
      entityId: created.id,
      action: 'UPLOAD_CREATED',
      message: 'Uploaded file created',
      metadata: {
        modelType,
        modelId,
        fileName,
        contentType: stored.contentType,
        sizeBytes: stored.size,
        objectKey: stored.key,
      },
    });

    devLogger.info('[uploads] createUploadSvc:success', {
      uploadId: created.id,
      modelType,
      modelId,
    });
    return created;
  } catch (error) {
    devLogger.error('[uploads] createUploadSvc:error', {
      companyId: input.companyId,
      uploadedBy: input.uploadedBy,
      modelType,
      modelId,
      fileName,
      message: error instanceof Error ? error.message : String(error),
      code:
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code ?? '')
          : '',
      name:
        typeof error === 'object' && error !== null && 'name' in error
          ? String((error as { name?: unknown }).name ?? '')
          : '',
    });
    throw error;
  }
}

export async function listUploadsSvc(input: {
  companyId: string;
  modelType: string;
  modelId: string;
}) {
  const modelType = normalizeModelSegment(input.modelType);
  const modelId = input.modelId.trim();
  if (!modelType || !modelId) throw BadRequest('modelType and modelId are required');
  return listUploadsRepo({ companyId: input.companyId, modelType, modelId });
}

export async function deleteUploadSvc(input: {
  companyId: string;
  uploadId: string;
  actorUserId: string;
}) {
  const existing = await getUploadRepo(input.uploadId, input.companyId);
  if (!existing) throw NotFound('Upload not found');

  await db.transaction(async (tx) => {
    const deleted = await deleteUploadRepo(input.uploadId, input.companyId, tx);
    if (!deleted) throw NotFound('Upload not found');

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'upload',
      entityId: input.uploadId,
      action: 'UPLOAD_DELETED',
      message: 'Upload deleted',
      metadata: {
        modelType: existing.modelType,
        modelId: existing.modelId,
        objectKey: existing.objectKey,
        fileName: existing.fileName,
      },
    });
  });

  await deleteStoredObject(existing.objectKey);
  return { id: input.uploadId };
}

export const getUploadObjectSvc = getStoredObjectResponse;
