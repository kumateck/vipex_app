import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import type {
  CommunicationCallSession,
  CommunicationMessage,
  CommunicationPresence,
} from '../api/communication.api';

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
          joinedAt: string;
          isMuted: boolean;
          isVideoOff: boolean;
        }>;
      };
    }
  | { type: 'communication.presence.updated'; payload: CommunicationPresence }
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
      joinedAt: string;
      isMuted: boolean;
      isVideoOff: boolean;
    }>;
  }) => void;
  onPresenceUpdated?: (payload: CommunicationPresence) => void;
  onTypingUpdated?: (payload: {
    threadId: string;
    userId: string;
    isTyping: boolean;
    at: string;
  }) => void;
};

const SOCKET_ENDPOINT_PATH = '/v1/communication/ws';

function toSocketBaseUrl(candidate: string): string | null {
  const normalizedCandidate = candidate.trim();
  if (!normalizedCandidate) return null;

  try {
    const baseUrl = new URL(
      normalizedCandidate,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    );
    const socketProtocol =
      baseUrl.protocol === 'https:' || baseUrl.protocol === 'wss:' ? 'wss:' : 'ws:';
    baseUrl.protocol = socketProtocol;
    baseUrl.pathname = baseUrl.pathname.includes(SOCKET_ENDPOINT_PATH)
      ? baseUrl.pathname
      : SOCKET_ENDPOINT_PATH;
    baseUrl.search = '';
    return baseUrl.toString();
  } catch {
    return null;
  }
}

export function useCommunicationSocket(options: UseCommunicationSocketOptions = {}) {
  const token = useAuthStore((state) => state.accessToken);
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const socketUrls = useMemo(() => {
    if (!token || typeof window === 'undefined') return null;
    const rawCandidates = [
      import.meta.env.VITE_COMMUNICATION_WS_URL,
      import.meta.env.VITE_WS_BASE_URL,
      import.meta.env.VITE_BACKEND_URL,
      import.meta.env.VITE_API_BASE_URL,
      window.location.origin,
    ];

    const uniqueSocketUrls = new Set<string>();

    for (const rawCandidate of rawCandidates) {
      if (typeof rawCandidate !== 'string') continue;
      for (const candidate of rawCandidate.split(',')) {
        const socketBaseUrl = toSocketBaseUrl(candidate);
        if (!socketBaseUrl) continue;
        const url = new URL(socketBaseUrl);
        url.searchParams.set('token', token);
        uniqueSocketUrls.add(url.toString());
      }
    }

    return uniqueSocketUrls.size ? [...uniqueSocketUrls] : null;
  }, [token]);

  useEffect(() => {
    if (!socketUrls?.length) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;
    let socketUrlIndex = 0;
    let hasConnectedAtLeastOnce = false;

    const connect = () => {
      const socketUrl = socketUrls[socketUrlIndex] ?? socketUrls[0];
      if (!socketUrl) return;
      socketRef.current = new WebSocket(socketUrl);
      const socket = socketRef.current;
      let opened = false;

      socket.onopen = () => {
        opened = true;
        hasConnectedAtLeastOnce = true;
        setIsConnected(true);
        pingTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
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
          if (parsed.type === 'communication.presence.updated') {
            optionsRef.current.onPresenceUpdated?.(parsed.payload);
            return;
          }
          if (parsed.type === 'communication.typing.updated') {
            optionsRef.current.onTypingUpdated?.(parsed.payload);
          }
        } catch {
          // Ignore malformed socket payloads.
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = null;
        if (stopped) return;

        // If the socket never opened, try the next configured endpoint first.
        if (!opened && socketUrls.length > 1) {
          socketUrlIndex = (socketUrlIndex + 1) % socketUrls.length;
        }

        reconnectTimer = setTimeout(connect, hasConnectedAtLeastOnce ? 2000 : 800);
      };

      socket.onerror = () => {
        // Keep close->reconnect flow as source of truth.
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

  const setPresence = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'communication.presence.set', payload: { status } }));
  }, []);

  const setTyping = useCallback((threadId: string, isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const normalizedThreadId = threadId.trim();
    if (!normalizedThreadId) return;
    socket.send(
      JSON.stringify({
        type: 'communication.typing.set',
        payload: { threadId: normalizedThreadId, isTyping },
      }),
    );
  }, []);

  const joinCall = useCallback((callId: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const normalizedCallId = callId.trim();
    if (!normalizedCallId) return;
    socket.send(
      JSON.stringify({ type: 'communication.call.join', payload: { callId: normalizedCallId } }),
    );
  }, []);

  const leaveCall = useCallback((callId: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const normalizedCallId = callId.trim();
    if (!normalizedCallId) return;
    socket.send(
      JSON.stringify({ type: 'communication.call.leave', payload: { callId: normalizedCallId } }),
    );
  }, []);

  const setCallMediaState = useCallback(
    (callId: string, payload: { isMuted?: boolean; isVideoOff?: boolean }) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      const normalizedCallId = callId.trim();
      if (!normalizedCallId) return;
      socket.send(
        JSON.stringify({
          type: 'communication.call.media.set',
          payload: { callId: normalizedCallId, ...payload },
        }),
      );
    },
    [],
  );

  const requestCallParticipants = useCallback((callId: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const normalizedCallId = callId.trim();
    if (!normalizedCallId) return;
    socket.send(
      JSON.stringify({
        type: 'communication.call.participants.get',
        payload: { callId: normalizedCallId },
      }),
    );
  }, []);

  return {
    isConnected,
    setPresence,
    setTyping,
    joinCall,
    leaveCall,
    setCallMediaState,
    requestCallParticipants,
  };
}
