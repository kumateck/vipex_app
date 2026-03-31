import type { Server, ServerWebSocket } from 'bun';
import { verifyAccessToken } from '@/server/utils/jwt';
import { ensureCompanyModuleEnabledSvc } from '@/server/features/company-modules/service';
import { getUserByIdRepo } from '@/server/features/auth/repository';
import type { CommunicationMessagesItem } from './messages/dto';
import type { CommunicationCallsItem } from './calls/dto';
import { createCommunicationPresenceRepo } from './presence/repository';
import type { CommunicationPresenceItem } from './presence/dto';
import {
  getCommunicationCallByIdRepo,
  updateCommunicationCallStatusRepo,
} from './calls/repository';
import { canTransitionCommunicationCallStatus } from './calls/status';

type CommunicationSocketData = {
  kind: 'communication';
  userId: string;
  companyId: string;
};

type CallParticipantState = {
  userId: string;
  joinedAt: string;
  isMuted: boolean;
  isVideoOff: boolean;
};

type CommunicationRealtimeEvent =
  | {
      type: 'communication.thread.created';
      payload: { id: string; threadType: string; userId: string };
    }
  | {
      type: 'communication.message.created';
      payload: CommunicationMessagesItem;
    }
  | {
      type: 'communication.call.created';
      payload: CommunicationCallsItem;
    }
  | {
      type: 'communication.call.updated';
      payload: CommunicationCallsItem;
    }
  | {
      type: 'communication.call.participants.updated';
      payload: { callId: string; participants: CallParticipantState[] };
    }
  | {
      type: 'communication.presence.updated';
      payload: CommunicationPresenceItem;
    }
  | {
      type: 'communication.typing.updated';
      payload: { threadId: string; userId: string; isTyping: boolean; at: string };
    }
  | {
      type: 'communication.pong';
      payload: { at: string };
    };

type IncomingSocketMessage =
  | {
      type: 'communication.presence.set';
      payload: { status: 'online' | 'away' | 'busy' | 'offline' };
    }
  | { type: 'communication.typing.set'; payload: { threadId: string; isTyping: boolean } }
  | { type: 'communication.call.join'; payload: { callId: string } }
  | { type: 'communication.call.leave'; payload: { callId: string } }
  | {
      type: 'communication.call.media.set';
      payload: { callId: string; isMuted?: boolean; isVideoOff?: boolean };
    }
  | { type: 'communication.call.participants.get'; payload: { callId: string } };

const companySockets = new Map<string, Set<ServerWebSocket<CommunicationSocketData>>>();
const callParticipantsByCompany = new Map<string, Map<string, Map<string, CallParticipantState>>>();
const socketJoinedCalls = new WeakMap<ServerWebSocket<CommunicationSocketData>, Set<string>>();

function addSocket(companyId: string, ws: ServerWebSocket<CommunicationSocketData>) {
  const set = companySockets.get(companyId) ?? new Set<ServerWebSocket<CommunicationSocketData>>();
  set.add(ws);
  companySockets.set(companyId, set);
}

function removeSocket(companyId: string, ws: ServerWebSocket<CommunicationSocketData>) {
  const set = companySockets.get(companyId);
  if (!set) return;
  set.delete(ws);
  if (!set.size) companySockets.delete(companyId);
}

function broadcast(companyId: string, event: CommunicationRealtimeEvent) {
  const set = companySockets.get(companyId);
  if (!set?.size) return;
  const encoded = JSON.stringify(event);
  for (const ws of set) {
    try {
      ws.send(encoded);
    } catch {
      // Ignore single-socket send errors; stale sockets are cleaned up on close.
    }
  }
}

function getParticipantsMap(companyId: string, callId: string): Map<string, CallParticipantState> {
  const companyMap =
    callParticipantsByCompany.get(companyId) ??
    new Map<string, Map<string, CallParticipantState>>();
  callParticipantsByCompany.set(companyId, companyMap);
  const callMap = companyMap.get(callId) ?? new Map<string, CallParticipantState>();
  companyMap.set(callId, callMap);
  return callMap;
}

function getParticipantsCount(companyId: string, callId: string): number {
  const companyMap = callParticipantsByCompany.get(companyId);
  if (!companyMap) return 0;
  const callMap = companyMap.get(callId);
  if (!callMap) return 0;
  return callMap.size;
}

function emitCallParticipants(companyId: string, callId: string) {
  const callMap = getParticipantsMap(companyId, callId);
  const participants = [...callMap.values()].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  broadcast(companyId, {
    type: 'communication.call.participants.updated',
    payload: { callId, participants },
  });
}

async function transitionCallStatusIfAllowed(params: {
  companyId: string;
  callId: string;
  nextStatus: 'active' | 'ended';
}) {
  const call = await getCommunicationCallByIdRepo({
    companyId: params.companyId,
    id: params.callId,
  });
  if (!call) return;
  if (!canTransitionCommunicationCallStatus(call.status, params.nextStatus)) return;
  if (call.status === params.nextStatus) return;
  const updated = await updateCommunicationCallStatusRepo({
    companyId: params.companyId,
    id: params.callId,
    status: params.nextStatus,
  });
  emitCommunicationCallUpdated(params.companyId, updated);
}

function removeUserFromCall(
  companyId: string,
  callId: string,
  userId: string,
  shouldBroadcast = true,
) {
  const companyMap = callParticipantsByCompany.get(companyId);
  if (!companyMap) return;
  const callMap = companyMap.get(callId);
  if (!callMap) return;
  callMap.delete(userId);
  if (!callMap.size) {
    companyMap.delete(callId);
  }
  if (!companyMap.size) {
    callParticipantsByCompany.delete(companyId);
  }
  if (shouldBroadcast) {
    emitCallParticipants(companyId, callId);
  }
}

function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim();
  }
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (token && token.trim()) return token.trim();
  return null;
}

export async function upgradeCommunicationSocket(
  request: Request,
  server: Server<CommunicationSocketData>,
): Promise<Response> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return new Response('Missing token', { status: 401 });
  }

  try {
    const payload = await verifyAccessToken(token);
    const userId = payload.sub;
    const userRecord = userId ? await getUserByIdRepo(userId) : null;
    const companyId = userRecord?.companyId ?? '';
    if (!userId || !companyId) {
      return new Response('Invalid token context', { status: 403 });
    }

    await ensureCompanyModuleEnabledSvc(companyId, 'communication_internal');

    const upgraded = server.upgrade(request, {
      data: { kind: 'communication', userId, companyId },
    });
    if (!upgraded) return new Response('Failed to upgrade websocket', { status: 426 });
    return new Response(null, { status: 101 });
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }
}

export const communicationSocketHandlers = {
  open(ws: ServerWebSocket<CommunicationSocketData>) {
    const data = ws.data;
    if (!data?.companyId) return;
    addSocket(data.companyId, ws);
    socketJoinedCalls.set(ws, new Set<string>());
  },
  async message(ws: ServerWebSocket<CommunicationSocketData>, message: string | Buffer) {
    const data = ws.data;
    if (!data?.companyId || !data.userId) return;
    const text = typeof message === 'string' ? message : message.toString();
    if (text === 'ping') {
      ws.send(
        JSON.stringify({
          type: 'communication.pong',
          payload: { at: new Date().toISOString() },
        } satisfies CommunicationRealtimeEvent),
      );
      return;
    }

    try {
      const parsed = JSON.parse(text) as IncomingSocketMessage;
      if (parsed.type === 'communication.presence.set') {
        const updated = await createCommunicationPresenceRepo({
          companyId: data.companyId,
          userId: data.userId,
          status: parsed.payload.status,
        });
        emitCommunicationPresenceUpdated(data.companyId, updated);
        return;
      }

      if (parsed.type === 'communication.typing.set') {
        const threadId = parsed.payload.threadId?.trim();
        if (!threadId) return;
        emitCommunicationTypingUpdated(data.companyId, {
          threadId,
          userId: data.userId,
          isTyping: parsed.payload.isTyping === true,
          at: new Date().toISOString(),
        });
        return;
      }

      if (parsed.type === 'communication.call.join') {
        const callId = parsed.payload.callId?.trim();
        if (!callId) return;
        const callMap = getParticipantsMap(data.companyId, callId);
        const current =
          callMap.get(data.userId) ??
          ({
            userId: data.userId,
            joinedAt: new Date().toISOString(),
            isMuted: false,
            isVideoOff: false,
          } satisfies CallParticipantState);
        callMap.set(data.userId, current);

        const joined = socketJoinedCalls.get(ws) ?? new Set<string>();
        joined.add(callId);
        socketJoinedCalls.set(ws, joined);

        emitCallParticipants(data.companyId, callId);
        const count = getParticipantsMap(data.companyId, callId).size;
        if (count === 1) {
          await transitionCallStatusIfAllowed({
            companyId: data.companyId,
            callId,
            nextStatus: 'active',
          });
        }
        return;
      }

      if (parsed.type === 'communication.call.leave') {
        const callId = parsed.payload.callId?.trim();
        if (!callId) return;
        removeUserFromCall(data.companyId, callId, data.userId);
        socketJoinedCalls.get(ws)?.delete(callId);
        const count = getParticipantsCount(data.companyId, callId);
        if (count === 0) {
          await transitionCallStatusIfAllowed({
            companyId: data.companyId,
            callId,
            nextStatus: 'ended',
          });
        }
        return;
      }

      if (parsed.type === 'communication.call.media.set') {
        const callId = parsed.payload.callId?.trim();
        if (!callId) return;
        const callMap = getParticipantsMap(data.companyId, callId);
        const current =
          callMap.get(data.userId) ??
          ({
            userId: data.userId,
            joinedAt: new Date().toISOString(),
            isMuted: false,
            isVideoOff: false,
          } satisfies CallParticipantState);
        callMap.set(data.userId, {
          ...current,
          isMuted: parsed.payload.isMuted ?? current.isMuted,
          isVideoOff: parsed.payload.isVideoOff ?? current.isVideoOff,
        });
        emitCallParticipants(data.companyId, callId);
        return;
      }

      if (parsed.type === 'communication.call.participants.get') {
        const callId = parsed.payload.callId?.trim();
        if (!callId) return;
        const participants = [...getParticipantsMap(data.companyId, callId).values()].sort((a, b) =>
          a.joinedAt.localeCompare(b.joinedAt),
        );
        ws.send(
          JSON.stringify({
            type: 'communication.call.participants.updated',
            payload: { callId, participants },
          } satisfies CommunicationRealtimeEvent),
        );
      }
    } catch {
      // ignore invalid socket messages
    }
  },
  close(ws: ServerWebSocket<CommunicationSocketData>) {
    const data = ws.data;
    if (!data?.companyId || !data.userId) return;
    const joinedCallIds = socketJoinedCalls.get(ws);
    if (joinedCallIds?.size) {
      for (const callId of joinedCallIds) {
        removeUserFromCall(data.companyId, callId, data.userId);
        const count = getParticipantsCount(data.companyId, callId);
        if (count === 0) {
          void transitionCallStatusIfAllowed({
            companyId: data.companyId,
            callId,
            nextStatus: 'ended',
          });
        }
      }
    }
    socketJoinedCalls.delete(ws);
    removeSocket(data.companyId, ws);
  },
};

export function emitCommunicationThreadCreated(params: {
  companyId: string;
  id: string;
  threadType: string;
  userId: string;
}) {
  broadcast(params.companyId, {
    type: 'communication.thread.created',
    payload: { id: params.id, threadType: params.threadType, userId: params.userId },
  });
}

export function emitCommunicationMessageCreated(
  companyId: string,
  payload: CommunicationMessagesItem,
) {
  broadcast(companyId, { type: 'communication.message.created', payload });
}

export function emitCommunicationCallCreated(companyId: string, payload: CommunicationCallsItem) {
  broadcast(companyId, { type: 'communication.call.created', payload });
}

export function emitCommunicationCallUpdated(companyId: string, payload: CommunicationCallsItem) {
  broadcast(companyId, { type: 'communication.call.updated', payload });
}

export function emitCommunicationPresenceUpdated(
  companyId: string,
  payload: CommunicationPresenceItem,
) {
  broadcast(companyId, { type: 'communication.presence.updated', payload });
}

export function emitCommunicationTypingUpdated(
  companyId: string,
  payload: { threadId: string; userId: string; isTyping: boolean; at: string },
) {
  broadcast(companyId, { type: 'communication.typing.updated', payload });
}
