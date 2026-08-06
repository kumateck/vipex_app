import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  handleSocketMessage,
  logMobileSocketError,
  resolveSocketCandidates,
  sanitizeSocketUrl,
  type UseCommunicationSocketOptions,
} from './use-communication-socket.helpers';

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
        handleSocketMessage(optionsRef.current, endpointUrl, event.data);
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
