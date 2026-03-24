import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth } from '@/server/plugins/auth';
import {
  createUploadSvc,
  deleteUploadSvc,
  getUploadObjectSvc,
  listUploadModelTypesSvc,
  listUploadsSvc,
} from './service';

export const uploadsRoutes = new Elysia({ prefix: '' })
  .use(authPlugin)
  .derive(() => ({
    serializeUpload(upload: {
      id: string;
      companyId: string;
      modelType: string;
      modelId: string;
      fileName: string;
      contentType: string;
      objectKey: string;
      fileUrl: string;
      sizeBytes: number;
      uploadedBy: string | null;
      isDeleted: boolean;
      createdAt: Date;
      updatedAt: Date;
    }) {
      return {
        id: upload.id,
        companyId: upload.companyId,
        modelType: upload.modelType,
        modelId: upload.modelId,
        fileName: upload.fileName,
        contentType: upload.contentType,
        objectKey: upload.objectKey,
        url: upload.fileUrl,
        sizeBytes: upload.sizeBytes,
        uploadedBy: upload.uploadedBy,
        createdAt: upload.createdAt.toISOString(),
        updatedAt: upload.updatedAt.toISOString(),
      };
    },
  }))
  .get('/model-types', () => listUploadModelTypesSvc(), {
    beforeHandle: [requireAuth()],
    response: t.Array(t.String()),
    detail: { tags: ['Uploads'], summary: 'List supported upload model types' },
  })
  .get(
    '/',
    async ({ query, user, serializeUpload }) =>
      (
        await listUploadsSvc({
          companyId: (user as AuthUser).companyId ?? '',
          modelType: query.modelType,
          modelId: query.modelId,
        })
      ).map(serializeUpload),
    {
      beforeHandle: [requireAuth()],
      query: t.Object({
        modelType: t.String({ minLength: 1, maxLength: 80 }),
        modelId: t.String({ minLength: 1, maxLength: 80 }),
      }),
      detail: { tags: ['Uploads'], summary: 'List uploads for a model record' },
    },
  )
  .post(
    '/',
    async ({ body, user, serializeUpload }) =>
      serializeUpload(
        await createUploadSvc({
          companyId: (user as AuthUser).companyId ?? '',
          uploadedBy: (user as AuthUser).sub,
          modelType: body.modelType,
          modelId: body.modelId,
          fileName: body.fileName,
          dataUrl: body.dataUrl,
        }),
      ),
    {
      beforeHandle: [requireAuth()],
      body: t.Object({
        modelType: t.String({ minLength: 1, maxLength: 80 }),
        modelId: t.String({ minLength: 1, maxLength: 80 }),
        fileName: t.String({ minLength: 1, maxLength: 255 }),
        dataUrl: t.String({ minLength: 20 }),
      }),
      detail: { tags: ['Uploads'], summary: 'Upload a file for a model record' },
    },
  )
  .delete(
    '/:id',
    async ({ params, user }) =>
      deleteUploadSvc({
        companyId: (user as AuthUser).companyId ?? '',
        uploadId: params.id,
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: [requireAuth()],
      params: t.Object({ id: t.String({ minLength: 1, maxLength: 25 }) }),
      detail: { tags: ['Uploads'], summary: 'Delete an upload record and stored object' },
    },
  )
  .get(
    '/object/*',
    async ({ params }) => {
      const wildcard = (params as { '*': string })['*'];
      const key = decodeURIComponent(wildcard);
      return getUploadObjectSvc(key);
    },
    {
      detail: { tags: ['Uploads'], summary: 'Read an uploaded object through the app proxy' },
    },
  );
