import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { getApiDebugInfo } from '@mobile/lib/api';
import type { CommunicationCallSession, CommunicationMessage } from '@mobile/types/communication';

type CommunicationSocketEvent =
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

type UseCommunicationSocketOptions = {
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

function sanitizeSocketUrl(raw: string | null | undefined) {
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

function logMobileSocketError(
  message: string,
  context: Record<string, unknown> = {},
  cause?: unknown,
) {
  if (cause) {
    console.error('[mobile-socket] request failed', {
      message,
      at: new Date().toISOString(),
      ...context,
      cause,
    });
    return;
  }
  console.error('[mobile-socket] request failed', {
    message,
    at: new Date().toISOString(),
    ...context,
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

function resolveSocketCandidates() {
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
  ).manifest2?.extra?.expoClient?.extra ?? {}) as { apiBaseUrl?: string };
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

export function useCommunicationSocket(
  accessToken: string | null | undefined,
  options: UseCommunicationSocketOptions = {},
) {
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const socketUrls = useMemo(() => {
    if (!accessToken?.trim()) return [];
    return resolveSocketCandidates().map((base) => {
      const url = new URL(base);
      url.searchParams.delete('token');
      url.searchParams.delete('access_token');
      url.searchParams.set('token', accessToken.trim());
      return url.toString();
    });
  }, [accessToken]);

  useEffect(() => {
    if (!socketUrls.length) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;
    let index = 0;
    let connectedOnce = false;

    const connect = () => {
      const targetUrl = socketUrls[index] ?? socketUrls[0];
      if (!targetUrl) return;
      const endpointUrl = sanitizeSocketUrl(targetUrl);

      const socket = new WebSocket(targetUrl);
      socketRef.current = socket;
      let opened = false;

      socket.onopen = () => {
        opened = true;
        connectedOnce = true;
        setIsConnected(true);
        pingTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as CommunicationSocketEvent;
          if (parsed.type === 'communication.thread.created') {
            try {
              optionsRef.current.onThreadCreated?.(parsed.payload);
            } catch (handlerError) {
              logMobileSocketError(
                'onThreadCreated handler failed',
                { endpointUrl, eventType: parsed.type },
                handlerError,
              );
            }
            return;
          }
          if (parsed.type === 'communication.message.created') {
            try {
              optionsRef.current.onMessageCreated?.(parsed.payload);
            } catch (handlerError) {
              logMobileSocketError(
                'onMessageCreated handler failed',
                { endpointUrl, eventType: parsed.type },
                handlerError,
              );
            }
            return;
          }
          if (parsed.type === 'communication.call.created') {
            try {
              optionsRef.current.onCallCreated?.(parsed.payload);
            } catch (handlerError) {
              logMobileSocketError(
                'onCallCreated handler failed',
                { endpointUrl, eventType: parsed.type },
                handlerError,
              );
            }
            return;
          }
          if (parsed.type === 'communication.call.updated') {
            try {
              optionsRef.current.onCallUpdated?.(parsed.payload);
            } catch (handlerError) {
              logMobileSocketError(
                'onCallUpdated handler failed',
                { endpointUrl, eventType: parsed.type },
                handlerError,
              );
            }
            return;
          }
          if (parsed.type === 'communication.call.participants.updated') {
            try {
              optionsRef.current.onCallParticipantsUpdated?.(parsed.payload);
            } catch (handlerError) {
              logMobileSocketError(
                'onCallParticipantsUpdated handler failed',
                { endpointUrl, eventType: parsed.type },
                handlerError,
              );
            }
            return;
          }
          if (parsed.type === 'communication.typing.updated') {
            try {
              optionsRef.current.onTypingUpdated?.(parsed.payload);
            } catch (handlerError) {
              logMobileSocketError(
                'onTypingUpdated handler failed',
                { endpointUrl, eventType: parsed.type },
                handlerError,
              );
            }
            return;
          }
          if (parsed.type === 'communication.pong') {
            return;
          }
          logMobileSocketError('Unhandled socket event type', {
            endpointUrl,
            eventType: (parsed as { type?: string }).type ?? 'unknown',
            payloadPreview: JSON.stringify(
              parsed,
              (_key, value) =>
                typeof value === 'string' && value.length > 300
                  ? `${value.slice(0, 300)}...`
                  : value,
              2,
            ),
          });
        } catch (parseError) {
          const rawData = String(event.data ?? '');
          logMobileSocketError(
            'Failed to parse socket payload',
            {
              endpointUrl,
              rawPayloadPreview: rawData.length > 400 ? `${rawData.slice(0, 400)}...` : rawData,
            },
            parseError,
          );
        }
      };

      socket.onerror = (errorEvent) => {
        logMobileSocketError('Socket error event', { endpointUrl }, errorEvent);
        // close handles reconnect
      };

      socket.onclose = (closeEvent) => {
        setIsConnected(false);
        socketRef.current = null;
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = null;
        if (closeEvent.code !== 1000) {
          logMobileSocketError('Socket closed unexpectedly', {
            endpointUrl,
            code: closeEvent.code,
            reason: closeEvent.reason,
            wasClean: closeEvent.wasClean,
          });
        }
        if (stopped) return;
        if (!opened && socketUrls.length > 1) {
          index = (index + 1) % socketUrls.length;
        }
        reconnectTimer = setTimeout(connect, connectedOnce ? 2000 : 800);
      };
    };

    connect();

    return () => {
      stopped = true;
      setIsConnected(false);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingTimer) clearInterval(pingTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [socketUrls]);

  const joinCall = useCallback((callId: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !callId.trim()) return;
    socket.send(
      JSON.stringify({ type: 'communication.call.join', payload: { callId: callId.trim() } }),
    );
  }, []);

  const leaveCall = useCallback((callId: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !callId.trim()) return;
    socket.send(
      JSON.stringify({ type: 'communication.call.leave', payload: { callId: callId.trim() } }),
    );
  }, []);

  const setCallMediaState = useCallback(
    (callId: string, payload: { isMuted?: boolean; isVideoOff?: boolean }) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN || !callId.trim()) return;
      socket.send(
        JSON.stringify({
          type: 'communication.call.media.set',
          payload: { callId: callId.trim(), ...payload },
        }),
      );
    },
    [],
  );

  const requestCallParticipants = useCallback((callId: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !callId.trim()) return;
    socket.send(
      JSON.stringify({
        type: 'communication.call.participants.get',
        payload: { callId: callId.trim() },
      }),
    );
  }, []);

  const setTyping = useCallback((threadId: string, isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !threadId.trim()) return;
    socket.send(
      JSON.stringify({
        type: 'communication.typing.set',
        payload: { threadId: threadId.trim(), isTyping },
      }),
    );
  }, []);

  return {
    isConnected,
    joinCall,
    leaveCall,
    setCallMediaState,
    requestCallParticipants,
    setTyping,
  };
}
