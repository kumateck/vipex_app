import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createId } from '@paralleldrive/cuid2';
import { NotFound } from '@/server/utils/http-error';
import { BadRequest } from '@/server/utils/http-error';
import { env } from '@/server/utils/env';

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

let ensureBucketPromise: Promise<void> | null = null;

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

    try {
      await client.send(new HeadBucketCommand({ Bucket: env.MINIO_BUCKET }));
    } catch {
      await client.send(new CreateBucketCommand({ Bucket: env.MINIO_BUCKET }));
    }
  })().catch((error) => {
    // Allow retries on subsequent requests if initial bucket check/create fails.
    ensureBucketPromise = null;
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
  await ensureBucketReady();

  const { buffer, contentType, extension } = parseDataUrl(input.dataUrl);
  const client = getClient();
  const folder = normalizeSegment(input.folder);
  const fileBase = normalizeSegment(input.fileName ?? createId());
  const date = new Date();
  const key = `${folder}/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${createId()}-${fileBase}.${extension}`;

  await client.send(
    new PutObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return {
    key,
    url: buildObjectProxyUrl(key),
    contentType,
    size: buffer.length,
  };
}

export async function getStoredObjectResponse(key: string) {
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
        'content-type': response.ContentType ?? 'application/octet-stream',
        'cache-control': response.CacheControl ?? 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    if (error instanceof NoSuchKey) throw NotFound('Stored file not found');
    throw error;
  }
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
