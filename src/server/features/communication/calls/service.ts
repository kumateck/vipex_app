import { SignJWT } from 'jose';
import type {
  CommunicationCallsCreateLivekitTokenInput,
  CommunicationCallsCreateInput,
  CommunicationCallsItem,
  CommunicationCallsLivekitTokenItem,
  CommunicationCallsListInput,
  CommunicationCallsUpdateStatusInput,
} from './dto';
import {
  createCommunicationCallsRepo,
  getCommunicationCallByIdRepo,
  listCommunicationCallsRepo,
  updateCommunicationCallStatusRepo,
} from './repository';
import { BadRequest, NotFound } from '@/server/utils/http-error';
import { emitCommunicationCallCreated, emitCommunicationCallUpdated } from '../realtime';
import { env } from '@/server/utils/env';
import { canTransitionCommunicationCallStatus } from './status';

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
  return listCommunicationCallsRepo(input);
}

export async function createCommunicationCallsSvc(
  input: CommunicationCallsCreateInput,
): Promise<CommunicationCallsItem> {
  if (!input.threadId && !input.channelId) {
    throw BadRequest('A call requires either threadId or channelId');
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
