type NetworkProbe = {
  url: string;
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error: string | null;
};

type ProbeGroup = {
  activeUrl: string;
  probes: NetworkProbe[];
};

export type DesktopNetworkDiagnostics = {
  selectedBaseUrl: string;
  candidates: string[];
  app: ProbeGroup;
  api: ProbeGroup;
  communicationWs: ProbeGroup;
};

function toRootUrl(input: string) {
  const parsed = new URL(input);
  parsed.pathname = parsed.pathname.replace(/\/v1\/?$/, '/');
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/+$/, '');
}

function toHealthUrl(baseUrl: string) {
  return `${toRootUrl(baseUrl)}/health`;
}

function toSocketHttpProbeUrl(baseUrl: string) {
  return `${toRootUrl(baseUrl)}/v1/communication/ws`;
}

async function probeHttpUrl(url: string, timeoutMs = 8000): Promise<NetworkProbe> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    return {
      url,
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    clearTimeout(timeout);
    const timeoutError =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError';
    return {
      url,
      ok: false,
      status: null,
      latencyMs: Date.now() - startedAt,
      error: timeoutError ? 'timeout' : error instanceof Error ? error.message : 'network_error',
    };
  }
}

async function probeSocketEndpoint(url: string): Promise<NetworkProbe> {
  const result = await probeHttpUrl(url);
  const reachableStatuses = new Set([101, 400, 401, 403, 404, 426]);
  const isReachableByStatus = result.status !== null && reachableStatuses.has(result.status);
  return {
    ...result,
    ok: result.ok || isReachableByStatus,
    error: result.ok || isReachableByStatus ? null : result.error,
  };
}

export async function runDesktopNetworkDiagnostics(input: {
  selectedBaseUrl: string;
  candidates: string[];
}): Promise<DesktopNetworkDiagnostics> {
  const uniqueCandidates = [...new Set(input.candidates.map((item) => toRootUrl(item)))];
  const selectedBaseUrl = toRootUrl(input.selectedBaseUrl);

  const appProbeTargets = uniqueCandidates.map((baseUrl) => `${baseUrl}/`);
  const apiProbeTargets = uniqueCandidates.map((baseUrl) => toHealthUrl(baseUrl));
  const wsProbeTargets = uniqueCandidates.map((baseUrl) => toSocketHttpProbeUrl(baseUrl));

  const [appProbes, apiProbes, wsProbes] = await Promise.all([
    Promise.all(appProbeTargets.map((url) => probeHttpUrl(url))),
    Promise.all(apiProbeTargets.map((url) => probeHttpUrl(url))),
    Promise.all(wsProbeTargets.map((url) => probeSocketEndpoint(url))),
  ]);

  return {
    selectedBaseUrl,
    candidates: uniqueCandidates,
    app: { activeUrl: `${selectedBaseUrl}/`, probes: appProbes },
    api: { activeUrl: toHealthUrl(selectedBaseUrl), probes: apiProbes },
    communicationWs: { activeUrl: toSocketHttpProbeUrl(selectedBaseUrl), probes: wsProbes },
  };
}
