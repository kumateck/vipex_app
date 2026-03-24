import { api } from '@/services/api';

export type UploadedImage = {
  id: string;
  companyId: string;
  modelType: string;
  modelId: string;
  fileName: string;
  objectKey: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export const uploadsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listUploads: builder.query<UploadedImage[], { modelType: string; modelId: string }>({
      query: (params) => ({
        url: '/uploads',
        params,
      }),
    }),
    uploadImage: builder.mutation<
      UploadedImage,
      { modelType: string; modelId: string; fileName: string; dataUrl: string }
    >({
      query: (body) => ({
        url: '/uploads',
        method: 'POST',
        body,
      }),
    }),
    deleteUpload: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/uploads/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const { useListUploadsQuery, useUploadImageMutation, useDeleteUploadMutation } = uploadsApi;
