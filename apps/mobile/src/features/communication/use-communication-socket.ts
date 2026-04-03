import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
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

function toSocketBaseUrl(raw?: string | null) {
  if (!raw?.trim()) return null;
  try {
    const parsed = new URL(raw.trim());
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    parsed.pathname = SOCKET_ENDPOINT_PATH;
    parsed.search = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

function resolveSocketCandidates() {
  const expoExtra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };
  const manifestExtra = ((
    Constants as unknown as {
      manifest2?: { extra?: { expoClient?: { extra?: { apiBaseUrl?: string } } } };
    }
  ).manifest2?.extra?.expoClient?.extra ?? {}) as { apiBaseUrl?: string };
  const baseCandidates = [
    process.env.EXPO_PUBLIC_API_BASE_URL,
    expoExtra.apiBaseUrl,
    manifestExtra.apiBaseUrl,
    'https://testing.app.vipexparcel.com',
  ];
  return [
    ...new Set(baseCandidates.map((value) => toSocketBaseUrl(value)).filter(Boolean) as string[]),
  ];
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
            optionsRef.current.onThreadCreated?.(parsed.payload);
            return;
          }
          if (parsed.type === 'communication.message.created') {
            optionsRef.current.onMessageCreated?.(parsed.payload);
            return;
          }
          if (parsed.type === 'communication.call.created') {
            optionsRef.current.onCallCreated?.(parsed.payload);
            return;
          }
          if (parsed.type === 'communication.call.updated') {
            optionsRef.current.onCallUpdated?.(parsed.payload);
            return;
          }
          if (parsed.type === 'communication.call.participants.updated') {
            optionsRef.current.onCallParticipantsUpdated?.(parsed.payload);
            return;
          }
          if (parsed.type === 'communication.typing.updated') {
            optionsRef.current.onTypingUpdated?.(parsed.payload);
          }
        } catch {
          // Ignore malformed payloads.
        }
      };

      socket.onerror = () => {
        // close handles reconnect
      };

      socket.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = null;
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
