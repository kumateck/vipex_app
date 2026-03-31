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

export function useCommunicationSocket(options: UseCommunicationSocketOptions = {}) {
  const token = useAuthStore((state) => state.accessToken);
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const socketUrl = useMemo(() => {
    if (!token || typeof window === 'undefined') return null;
    const explicitBaseUrl = [
      import.meta.env.VITE_WS_BASE_URL,
      import.meta.env.VITE_BACKEND_URL,
      import.meta.env.VITE_API_BASE_URL,
    ].find((value): value is string => typeof value === 'string' && value.trim().length > 0);

    const baseUrl = new URL(
      explicitBaseUrl?.trim() ?? window.location.origin,
      window.location.origin,
    );
    const socketProtocol =
      baseUrl.protocol === 'https:' || baseUrl.protocol === 'wss:' ? 'wss:' : 'ws:';
    const socketOrigin = `${socketProtocol}//${baseUrl.host}`;
    return `${socketOrigin}/v1/communication/ws?token=${encodeURIComponent(token)}`;
  }, [token]);

  useEffect(() => {
    if (!socketUrl) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const connect = () => {
      socketRef.current = new WebSocket(socketUrl);
      const socket = socketRef.current;

      socket.onopen = () => {
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
        reconnectTimer = setTimeout(connect, 2000);
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
  }, [socketUrl]);

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
