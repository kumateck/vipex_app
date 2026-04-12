import Constants from 'expo-constants';
import { getApiDebugInfo, runApiDiagnostics, type ApiProbeResult } from '@mobile/lib/api';

type HttpProbeResult = {
  url: string;
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error: string | null;
};

type WsProbeResult = {
  url: string;
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error: string | null;
};

type ProbeGroup<TProbe> = {
  activeUrl: string | null;
  candidates: string[];
  probes: TProbe[];
};

export type NetworkDiagnosticsResult = {
  api: {
    activeApiBaseUrl: string;
    probes: ApiProbeResult[];
  };
  livekit: ProbeGroup<WsProbeResult>;
  minio: ProbeGroup<HttpProbeResult>;
};

type NetworkDiagnosticsOptions = {
  communicationToken?: string | null;
  livekitAccessToken?: string | null;
};

const COMMUNICATION_SOCKET_PATH = '/v1/communication/ws';
const REMOTE_FALLBACK_ROOT = 'https://testing.app.vipexparcel.com';
const LIVEKIT_REMOTE_HOST = 'wss://rtc.vipexparcel.com/rtc/v1';
const MINIO_REMOTE_HEALTH = 'https://api.storage.kumateck.com/minio/health/live';

function unique(values: Array<string | null | undefined>) {
  return values
    .filter((entry): entry is string => Boolean(entry && entry.trim()))
    .filter((entry, index, all) => all.indexOf(entry) === index);
}

function toRootUrl(raw: string) {
  try {
    const parsed = new URL(raw);
    parsed.pathname = parsed.pathname.replace(/\/v1\/?$/, '');
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return raw.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
  }
}

function toWsBaseFromHttp(raw: string) {
  try {
    const parsed = new URL(raw);
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function normalizeWs(raw: string) {
  try {
    const parsed = new URL(raw.trim());
    parsed.protocol = parsed.protocol === 'https:' || parsed.protocol === 'wss:' ? 'wss:' : 'ws:';
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = COMMUNICATION_SOCKET_PATH;
    }
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

function isRemoteHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return !(
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '0.0.0.0' ||
    normalized.endsWith('.local')
  );
}

function isRemoteUrl(raw: string) {
  try {
    const parsed = new URL(raw);
    return isRemoteHost(parsed.hostname);
  } catch {
    return false;
  }
}

function withWsToken(
  url: string,
  opts: { communicationToken?: string | null; livekitAccessToken?: string | null },
) {
  try {
    const parsed = new URL(url);
    if (
      (parsed.pathname.includes('/communication/ws') || parsed.searchParams.has('token')) &&
      !parsed.searchParams.has('token') &&
      !parsed.searchParams.has('access_token') &&
      opts.communicationToken?.trim()
    ) {
      parsed.searchParams.set('token', opts.communicationToken.trim());
      return parsed.toString();
    }
    if (
      !parsed.searchParams.has('access_token') &&
      !parsed.searchParams.has('token') &&
      opts.livekitAccessToken?.trim()
    ) {
      parsed.searchParams.set('access_token', opts.livekitAccessToken.trim());
      return parsed.toString();
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

async function probeHttpUrl(url: string): Promise<HttpProbeResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    return {
      url,
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - started,
      error: null,
    };
  } catch (error) {
    clearTimeout(timeout);
    const isAbort =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError';
    return {
      url,
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error: isAbort ? 'timeout' : error instanceof Error ? error.message : 'network_error',
    };
  }
}

function probeWsUrl(url: string): Promise<WsProbeResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    let settled = false;
    const ws = new WebSocket(url);

    const finish = (payload: Omit<WsProbeResult, 'url' | 'latencyMs'>) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        // ignore close issues
      }
      resolve({
        url,
        latencyMs: Date.now() - started,
        ...payload,
      });
    };

    const timeout = setTimeout(() => {
      finish({ ok: false, status: null, error: 'timeout' });
    }, 7000);

    ws.onopen = () => {
      clearTimeout(timeout);
      finish({ ok: true, status: 101, error: null });
    };

    ws.onclose = (event) => {
      clearTimeout(timeout);
      // Closed quickly may still prove endpoint is reachable (unauthorized/token required).
      const consideredReachable = event.code === 1008 || event.code === 4001 || event.code === 4003;
      finish({
        ok: consideredReachable,
        status: event.code || null,
        error: consideredReachable ? 'reachable_but_rejected' : `closed_${event.code || 'unknown'}`,
      });
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      finish({ ok: false, status: null, error: 'connection_error' });
    };
  });
}

export async function runNetworkDiagnostics(
  options: NetworkDiagnosticsOptions = {},
): Promise<NetworkDiagnosticsResult> {
  const api = await runApiDiagnostics();
  const apiDebug = getApiDebugInfo();

  const extra = (Constants.expoConfig?.extra ?? {}) as {
    communicationWsUrl?: string;
    livekitUrl?: string;
    livekitWsUrl?: string;
    minioUrl?: string;
    s3Endpoint?: string;
  };

  const apiRoots = apiDebug.candidates
    .map((entry) => toRootUrl(entry))
    .filter((entry) => isRemoteUrl(entry));
  const activeRoot = toRootUrl(api.activeApiBaseUrl);
  const remoteRoot = isRemoteUrl(activeRoot) ? activeRoot : REMOTE_FALLBACK_ROOT;

  const derivedWs = [remoteRoot, ...apiRoots]
    .map((root) => toWsBaseFromHttp(root))
    .filter((entry): entry is string => Boolean(entry))
    .map((base) => `${base}${COMMUNICATION_SOCKET_PATH}`);

  const livekitCandidates = unique([
    process.env.EXPO_PUBLIC_COMMUNICATION_WS_URL,
    extra.communicationWsUrl,
    LIVEKIT_REMOTE_HOST,
    process.env.EXPO_PUBLIC_LIVEKIT_URL,
    process.env.EXPO_PUBLIC_LIVEKIT_WS_URL,
    process.env.EXPO_PUBLIC_WS_BASE_URL,
    extra.livekitUrl,
    extra.livekitWsUrl,
    ...derivedWs,
    'wss://testing.app.vipexparcel.com/v1/communication/ws',
  ])
    .map((entry) => normalizeWs(entry))
    .filter((entry): entry is string => Boolean(entry))
    .filter((entry) => isRemoteUrl(entry))
    .map((entry) =>
      withWsToken(entry, {
        communicationToken: options.communicationToken,
        livekitAccessToken: options.livekitAccessToken,
      }),
    );

  const minioCandidates = unique([
    MINIO_REMOTE_HEALTH,
    process.env.EXPO_PUBLIC_MINIO_URL,
    process.env.EXPO_PUBLIC_S3_ENDPOINT,
    extra.minioUrl,
    extra.s3Endpoint,
  ]).filter((entry) => isRemoteUrl(entry));

  const livekitProbes = await Promise.all(livekitCandidates.map((entry) => probeWsUrl(entry)));
  const minioProbes = await Promise.all(minioCandidates.map((entry) => probeHttpUrl(entry)));

  return {
    api,
    livekit: {
      activeUrl: livekitCandidates[0] ?? null,
      candidates: livekitCandidates,
      probes: livekitProbes,
    },
    minio: {
      activeUrl: minioCandidates[0] ?? null,
      candidates: minioCandidates,
      probes: minioProbes,
    },
  };
}
