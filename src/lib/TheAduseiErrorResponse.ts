import { toast } from 'sonner';

type ErrorLike = {
  code?: string;
  message?: string;
  status?: number;
  body?: unknown;
  cause?: unknown;
  data?: unknown;
  detail?: unknown;
  error?: unknown;
  errors?: unknown;
  response?: unknown;
};

let lastToast = { message: '', at: 0 };
let staleBuildReloadPending = false;
const STALE_BUILD_RELOAD_STATE_KEY = 'vipex:stale-build-reload-state';
const STALE_BUILD_MAX_RELOAD_ATTEMPTS = 3;
const STALE_BUILD_RELOAD_DELAY_MS = 1_500;

type StaleBuildReloadState = {
  attempts: number;
};

function errorToText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return `${error.name} ${error.message}`.trim();
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const name = typeof record.name === 'string' ? record.name : '';
    const message = typeof record.message === 'string' ? record.message : '';
    return `${name} ${message}`.trim();
  }
  return '';
}

export function isLikelyStaleBuildError(error: unknown): boolean {
  const text = errorToText(error).toLowerCase();
  if (!text) return false;
  return (
    text.includes('chunkloaderror') ||
    text.includes('loading chunk') ||
    text.includes('failed to fetch dynamically imported module') ||
    text.includes('importing a module script failed') ||
    text.includes('dynamically imported module')
  );
}

function readReloadState(): StaleBuildReloadState | null {
  try {
    const stored = window.sessionStorage.getItem(STALE_BUILD_RELOAD_STATE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<StaleBuildReloadState>;
    if (typeof parsed.attempts !== 'number') return null;
    return { attempts: parsed.attempts };
  } catch {
    return null;
  }
}

function writeReloadState(state: StaleBuildReloadState) {
  try {
    window.sessionStorage.setItem(STALE_BUILD_RELOAD_STATE_KEY, JSON.stringify(state));
  } catch {
    // The URL attempt counter still prevents loops when session storage is unavailable.
  }
}

export function createHardReloadUrl(currentUrl: string, now: number, attempt?: number): string {
  const nextUrl = new URL(currentUrl);
  nextUrl.searchParams.set('__hard_reload', String(now));
  if (attempt !== undefined) nextUrl.searchParams.set('__reload_attempt', String(attempt));
  return nextUrl.toString();
}

export function hardReloadApplication() {
  if (typeof window === 'undefined') return;
  window.location.replace(createHardReloadUrl(window.location.href, Date.now()));
}

export function getNextStaleBuildReloadAttempt(previousAttempts: number): number | null {
  if (!Number.isFinite(previousAttempts) || previousAttempts < 0) return 1;
  if (previousAttempts >= STALE_BUILD_MAX_RELOAD_ATTEMPTS) return null;
  return previousAttempts + 1;
}

function tryReloadForStaleBuild(): boolean {
  if (typeof window === 'undefined') return false;
  if (staleBuildReloadPending) return true;
  const storedState = readReloadState();
  const urlAttempt = Number(
    new URL(window.location.href).searchParams.get('__reload_attempt') ?? 0,
  );
  const previousAttempts = Math.max(
    storedState?.attempts ?? 0,
    Number.isFinite(urlAttempt) ? urlAttempt : 0,
  );

  const attempt = getNextStaleBuildReloadAttempt(previousAttempts);
  if (attempt === null) return false;

  const now = Date.now();
  staleBuildReloadPending = true;
  writeReloadState({ attempts: attempt });
  window.setTimeout(() => {
    window.location.replace(createHardReloadUrl(window.location.href, now, attempt));
  }, STALE_BUILD_RELOAD_DELAY_MS);
  return true;
}

export function tryRecoverFromStaleBuildError(error: unknown): boolean {
  return isLikelyStaleBuildError(error) && tryReloadForStaleBuild();
}

function readMessage(error: unknown, seen = new Set<object>()): string | null {
  if (!error) return null;

  if (typeof error === 'string') return error.trim() || null;
  if (typeof error !== 'object') return null;
  if (seen.has(error)) return null;
  seen.add(error);

  const err = error as ErrorLike;

  if (Array.isArray(err.errors)) {
    for (const item of err.errors) {
      const validationMessage = readMessage(item, seen);
      if (validationMessage) return validationMessage;
    }
  } else if (err.errors && typeof err.errors === 'object') {
    for (const value of Object.values(err.errors)) {
      const validationMessage = Array.isArray(value)
        ? readMessage(value[0], seen)
        : readMessage(value, seen);
      if (validationMessage) return validationMessage;
    }
  }

  for (const nested of [err.data, err.body, err.response, err.error, err.detail, err.cause]) {
    const nestedMessage = readMessage(nested, seen);
    if (nestedMessage) return nestedMessage;
  }

  const topMessage = err.message;
  if (typeof topMessage === 'string' && topMessage.trim()) return topMessage.trim();

  return null;
}

export function getErrorMessage(error: unknown, fallbackMessage = 'Something went wrong') {
  return readMessage(error) ?? fallbackMessage;
}

export async function getResponseError(response: Response, fallbackMessage: string) {
  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    try {
      body = await response.text();
    } catch {
      body = null;
    }
  }

  return new Error(getErrorMessage(body, fallbackMessage));
}

export function TheAduseiErrorResponse(error: unknown, fallbackMessage?: string) {
  const message = getErrorMessage(error, fallbackMessage);
  const now = Date.now();

  // Prevent spammy duplicate toasts when the same failing request re-renders.
  if (lastToast.message === message && now - lastToast.at < 1200) return message;

  lastToast = { message, at: now };
  toast.error(message);
  return message;
}

export function installTheAduseiGlobalErrorHandlers() {
  if (typeof window === 'undefined') return () => undefined;

  const onError = (event: ErrorEvent) => {
    const error = event.error ?? event.message;
    if (isLikelyStaleBuildError(error)) {
      tryRecoverFromStaleBuildError(error);
      return;
    }
    TheAduseiErrorResponse(error ?? 'Unexpected error');
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (isLikelyStaleBuildError(event.reason)) {
      tryRecoverFromStaleBuildError(event.reason);
      return;
    }
    TheAduseiErrorResponse(event.reason ?? 'Unhandled async error');
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}

export default TheAduseiErrorResponse;
