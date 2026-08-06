import Config from 'react-native-config';
import { Platform } from 'react-native';

const LOCAL_API_BASE_URL = 'http://127.0.0.1:3000';
const LOCAL_COMMUNICATION_WS_URL = 'ws://127.0.0.1:3000/v1/communication/ws';

function forCurrentPlatform(raw: string | undefined, fallback: string) {
  const value = raw?.trim() || fallback;
  if (Platform.OS !== 'android') return value;
  return value.replace('://localhost', '://10.0.2.2').replace('://127.0.0.1', '://10.0.2.2');
}

/**
 * Centralized runtime config, backed by react-native-config's `.env` files.
 * Replaces the old manifest-config fallback.
 * pattern that was duplicated across api.ts / mobile-error-reporter.ts /
 * network-diagnostics.ts / use-communication-socket.helpers.ts / login.tsx.
 */
export const ENV = {
  apiBaseUrl: forCurrentPlatform(Config.API_BASE_URL, LOCAL_API_BASE_URL),
  communicationWsUrl: forCurrentPlatform(Config.COMMUNICATION_WS_URL, LOCAL_COMMUNICATION_WS_URL),
  discordErrorWebhookUrl: Config.DISCORD_ERROR_WEBHOOK_URL ?? null,
  livekitUrl: Config.LIVEKIT_URL ?? null,
  livekitWsUrl: Config.LIVEKIT_WS_URL ?? null,
  minioUrl: Config.MINIO_URL ?? null,
  s3Endpoint: Config.S3_ENDPOINT ?? null,
  appVersion: Config.APP_VERSION ?? '1.0.2',
} as const;
