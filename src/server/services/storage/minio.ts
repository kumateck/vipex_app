import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createId } from '@paralleldrive/cuid2';
import { NotFound } from '@/server/utils/http-error';
import { BadRequest } from '@/server/utils/http-error';
import { env } from '@/server/utils/env';
import { logger } from '@/server/utils/logger';

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

let ensureBucketPromise: Promise<void> | null = null;

const MINIO_REQUEST_TIMEOUT_MS = Number.isFinite(Number(process.env.MINIO_REQUEST_TIMEOUT_MS))
  ? Number(process.env.MINIO_REQUEST_TIMEOUT_MS)
  : 45000;

function getErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

function getHttpStatusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null;
  const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;
  return typeof metadata?.httpStatusCode === 'number' ? metadata.httpStatusCode : null;
}

async function withTimeout<T>(task: Promise<T>, operation: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`MINIO_TIMEOUT:${operation}:${MINIO_REQUEST_TIMEOUT_MS}ms`));
    }, MINIO_REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([task, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function isConfigured() {
  return Boolean(
    env.MINIO_ENDPOINT && env.MINIO_ACCESS_KEY && env.MINIO_SECRET_KEY && env.MINIO_BUCKET,
  );
}

function getClient() {
  if (!isConfigured()) {
    throw BadRequest('MinIO storage is not configured');
  }

  return new S3Client({
    endpoint: env.MINIO_ENDPOINT,
    region: env.MINIO_REGION,
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY!,
      secretAccessKey: env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: env.MINIO_FORCE_PATH_STYLE,
  });
}

async function ensureBucketReady() {
  if (!isConfigured()) return;
  if (ensureBucketPromise) return ensureBucketPromise;

  ensureBucketPromise = (async () => {
    const client = getClient();
    const startedAt = Date.now();
    logger.info('[minio] ensureBucketReady:start', {
      endpoint: env.MINIO_ENDPOINT,
      bucket: env.MINIO_BUCKET,
      timeoutMs: MINIO_REQUEST_TIMEOUT_MS,
    });

    try {
      await withTimeout(
        client.send(new HeadBucketCommand({ Bucket: env.MINIO_BUCKET })),
        'HeadBucket',
      );
      logger.info('[minio] ensureBucketReady:head-ok', {
        bucket: env.MINIO_BUCKET,
        elapsedMs: Date.now() - startedAt,
      });
    } catch (error) {
      const statusCode = getHttpStatusCode(error);
      const code = getErrorCode(error);
      logger.warn('[minio] ensureBucketReady:head-failed', {
        bucket: env.MINIO_BUCKET,
        statusCode,
        code,
        message: error instanceof Error ? error.message : String(error),
        elapsedMs: Date.now() - startedAt,
      });

      if (statusCode !== 404 && code !== 'NotFound' && code !== 'NoSuchBucket') {
        throw error;
      }

      await withTimeout(
        client.send(new CreateBucketCommand({ Bucket: env.MINIO_BUCKET })),
        'CreateBucket',
      );
      logger.info('[minio] ensureBucketReady:create-ok', {
        bucket: env.MINIO_BUCKET,
        elapsedMs: Date.now() - startedAt,
      });
    }
  })().catch((error) => {
    // Allow retries on subsequent requests if initial bucket check/create fails.
    ensureBucketPromise = null;
    logger.error('[minio] ensureBucketReady:error', {
      endpoint: env.MINIO_ENDPOINT,
      bucket: env.MINIO_BUCKET,
      code: getErrorCode(error),
      statusCode: getHttpStatusCode(error),
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  });

  return ensureBucketPromise;
}

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

  await ensureBucketReady();

  const { buffer, contentType, extension } = parseDataUrl(input.dataUrl);
  const client = getClient();
  const folder = normalizeSegment(input.folder);
  const fileBase = normalizeSegment(input.fileName ?? createId());
  const date = new Date();
  const key = `${folder}/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${createId()}-${fileBase}.${extension}`;

  try {
    await withTimeout(
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
      code: getErrorCode(error),
      statusCode: getHttpStatusCode(error),
      message: error instanceof Error ? error.message : String(error),
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
  await ensureBucketReady();
  const client = getClient();

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
  await ensureBucketReady();
  const client = getClient();

  try {
    await client.send(new HeadObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }));
  } catch (error) {
    const code = getErrorCode(error);
    const status = getHttpStatusCode(error);

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
  await ensureBucketReady();
  const client = getClient();

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
  await ensureBucketReady();
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: key,
    }),
  );
}
