import { listCommunicationPushTokensForUsers } from './tokens';

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
};

const recentPushDedupe = new Map<string, number>();
const DEDUPE_TTL_MS = 15_000;

function shouldSendByDedupe(key: string) {
  const now = Date.now();
  const prev = recentPushDedupe.get(key);
  if (prev && now - prev < DEDUPE_TTL_MS) return false;
  recentPushDedupe.set(key, now);

  // Lazy cleanup
  for (const [entryKey, ts] of recentPushDedupe) {
    if (now - ts > DEDUPE_TTL_MS * 4) {
      recentPushDedupe.delete(entryKey);
    }
  }
  return true;
}

export async function sendCommunicationPushToUsers(input: {
  companyId: string;
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  dedupeKey?: string;
}) {
  const tokens = await listCommunicationPushTokensForUsers({
    companyId: input.companyId,
    userIds: input.userIds,
  });
  if (!tokens.length) return;

  const dedupeKey = input.dedupeKey?.trim();
  if (dedupeKey && !shouldSendByDedupe(dedupeKey)) return;

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title: input.title,
    body: input.body,
    data: input.data,
    sound: 'default',
  }));

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch {
    // Non-blocking best-effort push.
  }
}
