import Constants from 'expo-constants';
import { getApiDebugInfo } from '@mobile/lib/api';
import { reportMobileErrorToDiscord } from '@mobile/lib/mobile-error-reporter';
import type { CommunicationCallSession, CommunicationMessage } from '@mobile/types/communication';

export type CommunicationSocketEvent =
  | {
      type: 'communication.thread.created';
      payload: { id: string; threadType: string; userId: string };
    }
  | { type: 'communication.message.created'; payload: CommunicationMessage }
  | { type: 'communication.call.created'; payload: CommunicationCallSession }
  | { type: 'communication.call.updated'; payload: CommunicationCallSession }
  | {
      type: 'communication.call.participants.updated';
      payload: {
        callId: string;
        participants: Array<{
          userId: string;
          displayName?: string;
          joinedAt: string;
          isMuted: boolean;
          isVideoOff: boolean;
        }>;
      };
    }
  | {
      type: 'communication.typing.updated';
      payload: { threadId: string; userId: string; isTyping: boolean; at: string };
    }
  | { type: 'communication.pong'; payload: { at: string } };

export type UseCommunicationSocketOptions = {
  onThreadCreated?: (payload: { id: string; threadType: string; userId: string }) => void;
  onMessageCreated?: (payload: CommunicationMessage) => void;
  onCallCreated?: (payload: CommunicationCallSession) => void;
  onCallUpdated?: (payload: CommunicationCallSession) => void;
  onCallParticipantsUpdated?: (payload: {
    callId: string;
    participants: Array<{
      userId: string;
      displayName?: string;
      joinedAt: string;
      isMuted: boolean;
      isVideoOff: boolean;
    }>;
  }) => void;
  onTypingUpdated?: (payload: {
    threadId: string;
    userId: string;
    isTyping: boolean;
    at: string;
  }) => void;
};

const SOCKET_ENDPOINT_PATH = '/v1/communication/ws';

export function sanitizeSocketUrl(raw: string | null | undefined) {
  if (!raw?.trim()) return null;
  try {
    const parsed = new URL(raw.trim());
    parsed.searchParams.delete('token');
    parsed.searchParams.delete('access_token');
    return parsed.toString();
  } catch {
    return raw;
  }
}

export function logMobileSocketError(
  message: string,
  context: Record<string, unknown> = {},
  cause?: unknown,
) {
  const payload: Record<string, unknown> = {
    message,
    at: new Date().toISOString(),
    ...context,
    ...(cause ? { cause } : {}),
  };
  console.error('[mobile-socket] request failed', payload);
  reportMobileErrorToDiscord({
    source: 'mobile-socket',
    message,
    context: payload,
    cause,
  });
}

function toSocketBaseUrl(raw?: string | null) {
  if (!raw?.trim()) return null;
  try {
    const parsed = new URL(raw.trim());
    parsed.protocol = parsed.protocol === 'https:' || parsed.protocol === 'wss:' ? 'wss:' : 'ws:';
    parsed.pathname = parsed.pathname.includes(SOCKET_ENDPOINT_PATH)
      ? parsed.pathname
      : SOCKET_ENDPOINT_PATH;
    parsed.search = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

export function resolveSocketCandidates() {
  const apiDebug = getApiDebugInfo();
  const expoExtra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };
  const mobileExtra = (Constants.expoConfig?.extra ?? {}) as {
    communicationWsUrl?: string;
    wsBaseUrl?: string;
  };
  const manifestExtra = ((
    Constants as unknown as {
      manifest2?: { extra?: { expoClient?: { extra?: { apiBaseUrl?: string } } } };
    }
  ).manifest2?.extra?.expoClient?.extra ?? {}) as {
    apiBaseUrl?: string;
  };
  const baseCandidates = [
    process.env.EXPO_PUBLIC_COMMUNICATION_WS_URL,
    process.env.EXPO_PUBLIC_WS_BASE_URL,
    process.env.EXPO_PUBLIC_API_BASE_URL,
    apiDebug.activeApiBaseUrl,
    ...apiDebug.candidates,
    mobileExtra.communicationWsUrl,
    mobileExtra.wsBaseUrl,
    expoExtra.apiBaseUrl,
    manifestExtra.apiBaseUrl,
    'https://testing.app.vipexparcel.com',
  ];
  const normalized = new Set<string>();

  for (const candidate of baseCandidates) {
    if (!candidate) continue;
    for (const segment of candidate.split(',')) {
      const parsed = toSocketBaseUrl(segment);
      if (!parsed) continue;
      normalized.add(parsed);
    }
  }
  return [...normalized];
}

function previewPayload(input: unknown) {
  return JSON.stringify(
    input,
    (_key, value) =>
      typeof value === 'string' && value.length > 300 ? `${value.slice(0, 300)}...` : value,
    2,
  );
}

function safeInvoke(
  endpointUrl: string | null,
  eventType: string,
  handler: (() => void) | undefined,
) {
  if (!handler) return;
  try {
    handler();
  } catch (handlerError) {
    logMobileSocketError(`${eventType} handler failed`, { endpointUrl, eventType }, handlerError);
  }
}

export function handleSocketMessage(
  options: UseCommunicationSocketOptions,
  endpointUrl: string | null,
  eventData: unknown,
) {
  try {
    const parsed = JSON.parse(String(eventData)) as CommunicationSocketEvent;
    if (parsed.type === 'communication.thread.created')
      return safeInvoke(endpointUrl, parsed.type, () => options.onThreadCreated?.(parsed.payload));
    if (parsed.type === 'communication.message.created')
      return safeInvoke(endpointUrl, parsed.type, () => options.onMessageCreated?.(parsed.payload));
    if (parsed.type === 'communication.call.created')
      return safeInvoke(endpointUrl, parsed.type, () => options.onCallCreated?.(parsed.payload));
    if (parsed.type === 'communication.call.updated')
      return safeInvoke(endpointUrl, parsed.type, () => options.onCallUpdated?.(parsed.payload));
    if (parsed.type === 'communication.call.participants.updated')
      return safeInvoke(endpointUrl, parsed.type, () =>
        options.onCallParticipantsUpdated?.(parsed.payload),
      );
    if (parsed.type === 'communication.typing.updated')
      return safeInvoke(endpointUrl, parsed.type, () => options.onTypingUpdated?.(parsed.payload));
    if (parsed.type === 'communication.pong') return;
    logMobileSocketError('Unhandled socket event type', {
      endpointUrl,
      eventType: (parsed as { type?: string }).type ?? 'unknown',
      payloadPreview: previewPayload(parsed),
    });
  } catch (parseError) {
    const rawData = String(eventData ?? '');
    logMobileSocketError(
      'Failed to parse socket payload',
      {
        endpointUrl,
        rawPayloadPreview: rawData.length > 400 ? `${rawData.slice(0, 400)}...` : rawData,
      },
      parseError,
    );
  }
}
