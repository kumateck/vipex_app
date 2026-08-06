import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '@/server/utils/env';
import { BadRequest } from '@/server/utils/http-error';
import { logger } from '@/server/utils/logger';

let ensureBucketPromise: Promise<void> | null = null;

const requestTimeoutMs = Number.isFinite(Number(process.env.MINIO_REQUEST_TIMEOUT_MS))
  ? Number(process.env.MINIO_REQUEST_TIMEOUT_MS)
  : 45000;

export function getMinioErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

export function getMinioHttpStatusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null;
  const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;
  return typeof metadata?.httpStatusCode === 'number' ? metadata.httpStatusCode : null;
}

export async function withMinioTimeout<T>(task: Promise<T>, operation: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`MINIO_TIMEOUT:${operation}:${requestTimeoutMs}ms`));
    }, requestTimeoutMs);
  });

  try {
    return await Promise.race([task, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function isMinioConfigured() {
  return Boolean(
    env.MINIO_ENDPOINT && env.MINIO_ACCESS_KEY && env.MINIO_SECRET_KEY && env.MINIO_BUCKET,
  );
}

export function getMinioClient() {
  if (!isMinioConfigured()) throw BadRequest('MinIO storage is not configured');

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

export async function ensureMinioBucketReady() {
  if (!isMinioConfigured()) return;
  if (ensureBucketPromise) return ensureBucketPromise;

  ensureBucketPromise = ensureBucket().catch((error) => {
    ensureBucketPromise = null;
    logger.error('[minio] ensureBucketReady:error', {
      endpoint: env.MINIO_ENDPOINT,
      bucket: env.MINIO_BUCKET,
      code: getMinioErrorCode(error),
      statusCode: getMinioHttpStatusCode(error),
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  });

  return ensureBucketPromise;
}

async function ensureBucket() {
  const client = getMinioClient();
  const startedAt = Date.now();
  logger.info('[minio] ensureBucketReady:start', {
    endpoint: env.MINIO_ENDPOINT,
    bucket: env.MINIO_BUCKET,
    timeoutMs: requestTimeoutMs,
  });

  try {
    await withMinioTimeout(
      client.send(new HeadBucketCommand({ Bucket: env.MINIO_BUCKET })),
      'HeadBucket',
    );
    logger.info('[minio] ensureBucketReady:head-ok', {
      bucket: env.MINIO_BUCKET,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (error) {
    const statusCode = getMinioHttpStatusCode(error);
    const code = getMinioErrorCode(error);
    logger.warn('[minio] ensureBucketReady:head-failed', {
      bucket: env.MINIO_BUCKET,
      statusCode,
      code,
      message: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - startedAt,
    });

    if (statusCode !== 404 && code !== 'NotFound' && code !== 'NoSuchBucket') throw error;

    await withMinioTimeout(
      client.send(new CreateBucketCommand({ Bucket: env.MINIO_BUCKET })),
      'CreateBucket',
    );
    logger.info('[minio] ensureBucketReady:create-ok', {
      bucket: env.MINIO_BUCKET,
      elapsedMs: Date.now() - startedAt,
    });
  }
}
