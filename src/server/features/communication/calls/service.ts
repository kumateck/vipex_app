import { SignJWT } from 'jose';
import type {
  CommunicationCallsCreateLivekitTokenInput,
  CommunicationCallsCreateInput,
  CommunicationCallsItem,
  CommunicationVoiceJoinInput,
  CommunicationVoiceJoinItem,
  CommunicationCallsLivekitTokenItem,
  CommunicationCallsListInput,
  CommunicationCallsUpdateStatusInput,
} from './dto';
import {
  createCommunicationCallsRepo,
  getLatestOpenChannelCallRepo,
  getCommunicationCallByIdRepo,
  listCommunicationCallsRepo,
  updateCommunicationCallStatusRepo,
} from './repository';
import { BadRequest, Forbidden, NotFound } from '@/server/utils/http-error';
import { emitCommunicationCallCreated, emitCommunicationCallUpdated } from '../realtime';
import { env } from '@/server/utils/env';
import { canTransitionCommunicationCallStatus } from './status';
import {
  canAccessChannelAccessRepo,
  canUserAccessCallContextAccessRepo,
} from '../access/repository';
import { getCommunicationChannelByIdRepo } from '../channels/repository';

function resolveLivekitClientUrl(requestOrigin?: string | null) {
  if (env.LIVEKIT_PUBLIC_URL) {
    return env.LIVEKIT_PUBLIC_URL;
  }
  if (!env.LIVEKIT_URL) {
    throw BadRequest('LiveKit is not configured on this environment');
  }

  const configured = new URL(env.LIVEKIT_URL);
  const likelyInternalHost =
    configured.hostname === 'livekit' ||
    configured.hostname === 'localhost' ||
    configured.hostname.endsWith('.local') ||
    configured.hostname.endsWith('.internal');

  if (!likelyInternalHost) {
    return configured.origin;
  }

  if (!requestOrigin) return configured.origin;
  try {
    const origin = new URL(requestOrigin);
    const derived = new URL(env.LIVEKIT_URL);
    // Keep LiveKit port/path, but use browser-resolvable host/protocol.
    derived.hostname = origin.hostname;
    derived.protocol = origin.protocol === 'https:' ? 'https:' : 'http:';
    return derived.origin;
  } catch {
    return configured.origin;
  }
}

export async function listCommunicationCallsSvc(
  input: CommunicationCallsListInput,
): Promise<CommunicationCallsItem[]> {
  const rows = await listCommunicationCallsRepo(input);
  const checks = await Promise.all(
    rows.map((row) =>
      canUserAccessCallContextAccessRepo({
        companyId: input.companyId,
        userId: input.userId,
        threadId: row.threadId,
        channelId: row.channelId,
      }),
    ),
  );
  return rows.filter((_row, index) => checks[index] === true);
}

export async function createCommunicationCallsSvc(
  input: CommunicationCallsCreateInput,
): Promise<CommunicationCallsItem> {
  if (!input.threadId && !input.channelId) {
    throw BadRequest('A call requires either threadId or channelId');
  }

  const canAccess = await canUserAccessCallContextAccessRepo({
    companyId: input.companyId,
    userId: input.userId,
    threadId: input.threadId ?? null,
    channelId: input.channelId ?? null,
  });
  if (!canAccess) {
    throw Forbidden('You do not have access to start a call in this context');
  }

  if (input.channelId) {
    const channelAccess = await canAccessChannelAccessRepo({
      companyId: input.companyId,
      channelId: input.channelId,
      userId: input.userId,
    });
    if (!channelAccess) {
      throw Forbidden('You do not have access to this channel');
    }
  }

  const created = await createCommunicationCallsRepo(input);
  emitCommunicationCallCreated(input.companyId, created);
  return created;
}

export async function updateCommunicationCallStatusSvc(
  input: CommunicationCallsUpdateStatusInput,
): Promise<CommunicationCallsItem> {
  const call = await getCommunicationCallByIdRepo({ companyId: input.companyId, id: input.id });
  if (!call) throw NotFound('Call session not found');
  const canAccess = await canUserAccessCallContextAccessRepo({
    companyId: input.companyId,
    userId: input.userId,
    threadId: call.threadId,
    channelId: call.channelId,
  });
  if (!canAccess) throw Forbidden('You do not have access to this call');
  if (!canTransitionCommunicationCallStatus(call.status, input.status)) {
    throw BadRequest(`Invalid call status transition from ${call.status} to ${input.status}`);
  }

  const updated = await updateCommunicationCallStatusRepo(input);
  emitCommunicationCallUpdated(input.companyId, updated);
  return updated;
}

export async function createCommunicationCallLivekitTokenSvc(
  input: CommunicationCallsCreateLivekitTokenInput,
): Promise<CommunicationCallsLivekitTokenItem> {
  if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
    throw BadRequest('LiveKit is not configured on this environment');
  }

  const call = await getCommunicationCallByIdRepo({ companyId: input.companyId, id: input.id });
  if (!call) throw NotFound('Call session not found');
  const canAccess = await canUserAccessCallContextAccessRepo({
    companyId: input.companyId,
    userId: input.userId,
    threadId: call.threadId,
    channelId: call.channelId,
  });
  if (!canAccess) throw Forbidden('You do not have access to this call');

  const roomName = (call.livekitRoomName ?? '').trim() || `call-${call.id}`;
  const now = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = now + 60 * 60;
  const secret = new TextEncoder().encode(env.LIVEKIT_API_SECRET);

  const token = await new SignJWT({
    video: {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    },
    name: input.userId,
    metadata: JSON.stringify({
      callId: call.id,
      companyId: input.companyId,
      userId: input.userId,
    }),
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(env.LIVEKIT_API_KEY)
    .setSubject(input.userId)
    .setIssuedAt(now)
    .setExpirationTime(expiresAtSeconds)
    .sign(secret);

  return {
    callId: call.id,
    roomName,
    livekitUrl: resolveLivekitClientUrl(input.requestOrigin),
    token,
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
  };
}

export async function joinCommunicationVoiceChannelSvc(
  input: CommunicationVoiceJoinInput,
): Promise<CommunicationVoiceJoinItem> {
  const canAccess = await canAccessChannelAccessRepo({
    companyId: input.companyId,
    channelId: input.channelId,
    userId: input.userId,
  });
  if (!canAccess) throw Forbidden('You do not have access to this channel');
  const channel = await getCommunicationChannelByIdRepo({
    companyId: input.companyId,
    userId: input.userId,
    id: input.channelId,
  });
  if (!channel) throw NotFound('Channel not found');
  if (channel.channelType !== 'voice') {
    throw BadRequest('Only voice channels can be joined through this endpoint');
  }
  if (!channel.isCallEnabled) {
    throw BadRequest('Voice channel calls are disabled');
  }

  let call =
    (await getLatestOpenChannelCallRepo({
      companyId: input.companyId,
      channelId: input.channelId,
    })) ?? null;

  if (!call) {
    call = await createCommunicationCallsRepo({
      companyId: input.companyId,
      userId: input.userId,
      channelId: input.channelId,
      callType: 'audio',
      livekitRoomName: `voice-channel-${input.channelId}`,
    });
    emitCommunicationCallCreated(input.companyId, call);
  }

  if (call.status !== 'active' && canTransitionCommunicationCallStatus(call.status, 'active')) {
    call = await updateCommunicationCallStatusRepo({
      companyId: input.companyId,
      id: call.id,
      status: 'active',
    });
    emitCommunicationCallUpdated(input.companyId, call);
  }

  const livekit = await createCommunicationCallLivekitTokenSvc({
    companyId: input.companyId,
    userId: input.userId,
    id: call.id,
    requestOrigin: input.requestOrigin ?? null,
  });

  return { call, livekit };
}
