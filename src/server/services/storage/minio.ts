import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createId } from '@paralleldrive/cuid2';
import { NotFound } from '@/server/utils/http-error';
import { BadRequest } from '@/server/utils/http-error';
import { env } from '@/server/utils/env';
import { logger } from '@/server/utils/logger';
import {
  ensureMinioBucketReady,
  getMinioClient,
  getMinioErrorCode,
  getMinioHttpStatusCode,
  withMinioTimeout,
} from './minio-client';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/zip': 'zip',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const PRESIGNED_URL_TTL_SECONDS = 300;

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/);
  if (!match) throw BadRequest('Only base64 data URLs are supported');

  const contentType = match[1]!.split(';')[0]!.trim().toLowerCase();
  const base64 = match[2]!;
  const extension = MIME_EXTENSIONS[contentType];
  if (!extension) throw BadRequest('Unsupported file type');

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) throw BadRequest('File payload is empty');
  if (buffer.length > MAX_UPLOAD_SIZE_BYTES) throw BadRequest('File exceeds 10MB limit');

  return { buffer, contentType, extension };
}

function normalizeSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'file'
  );
}

export function buildObjectProxyUrl(key: string) {
  return `/v1/uploads/object/${key}`;
}

export async function uploadImageDataUrl(input: {
  folder: string;
  dataUrl: string;
  fileName?: string | null;
}) {
  const startedAt = Date.now();
  logger.info('[minio] uploadImageDataUrl:start', {
    folder: input.folder,
    fileName: input.fileName ?? null,
    dataUrlLength: input.dataUrl.length,
  });

  await ensureMinioBucketReady();

  const { buffer, contentType, extension } = parseDataUrl(input.dataUrl);
  const client = getMinioClient();
  const folder = normalizeSegment(input.folder);
  const fileBase = normalizeSegment(input.fileName ?? createId());
  const date = new Date();
  const key = `${folder}/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${createId()}-${fileBase}.${extension}`;

  try {
    await withMinioTimeout(
      client.send(
        new PutObjectCommand({
          Bucket: env.MINIO_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ContentLength: buffer.length,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      ),
      'PutObject',
    );
  } catch (error) {
    logger.error('[minio] uploadImageDataUrl:put-error', {
      bucket: env.MINIO_BUCKET,
      key,
      sizeBytes: buffer.length,
      contentType,
      code: getMinioErrorCode(error),
      statusCode: getMinioHttpStatusCode(error),
      message: getApplicationErrorMessage(error, '') || String(error),
      elapsedMs: Date.now() - startedAt,
    });
    throw error;
  }

  logger.info('[minio] uploadImageDataUrl:success', {
    bucket: env.MINIO_BUCKET,
    key,
    sizeBytes: buffer.length,
    contentType,
    elapsedMs: Date.now() - startedAt,
  });

  return {
    key,
    url: buildObjectProxyUrl(key),
    contentType,
    size: buffer.length,
  };
}

export async function getStoredObjectResponse(
  key: string,
  options?: { cacheControl?: string; contentType?: string },
) {
  await ensureMinioBucketReady();
  const client = getMinioClient();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: key,
      }),
    );

    return new Response(response.Body?.transformToWebStream() ?? null, {
      headers: {
        'content-type': options?.contentType ?? response.ContentType ?? 'application/octet-stream',
        'cache-control':
          options?.cacheControl ?? response.CacheControl ?? 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    if (error instanceof NoSuchKey) throw NotFound('Stored file not found');
    throw error;
  }
}

export async function headStoredObject(key: string): Promise<void> {
  await ensureMinioBucketReady();
  const client = getMinioClient();

  try {
    await client.send(new HeadObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }));
  } catch (error) {
    const code = getMinioErrorCode(error);
    const status = getMinioHttpStatusCode(error);

    if (code === 'NotFound' || status === 404) {
      throw NotFound('Stored file not found');
    }

    if (code === 'AccessDenied' || status === 403) {
      logger.warn('[minio] headStoredObject:access-denied', {
        key,
        bucket: env.MINIO_BUCKET,
        code,
        status,
      });
      throw NotFound('Stored file not found');
    }

    throw error;
  }
}

export async function getStoredObjectPresignedUrl(
  key: string,
  options?: { expiresInSeconds?: number; contentType?: string },
): Promise<string> {
  await ensureMinioBucketReady();
  const client = getMinioClient();

  const command = new GetObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
    ...(options?.contentType ? { ResponseContentType: options.contentType } : {}),
  });

  return getSignedUrl(client, command, {
    expiresIn: options?.expiresInSeconds ?? PRESIGNED_URL_TTL_SECONDS,
  });
}

export async function deleteStoredObject(key: string) {
  await ensureMinioBucketReady();
  const client = getMinioClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: key,
    }),
  );
}
