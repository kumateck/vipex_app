import { logger } from '@/server/utils/logger';

export async function safeCall<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    logger.error(`ai-briefs: ${label} aggregation failed`, err);
    return null;
  }
}
