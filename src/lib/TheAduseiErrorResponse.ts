import { toast } from 'sonner';

type ErrorLike = {
  message?: string;
  status?: number;
  data?: unknown;
  error?: unknown;
  errors?: Array<{ description?: string; message?: string }>;
};

let lastToast = { message: '', at: 0 };
const STALE_BUILD_RELOAD_GUARD_KEY = 'vipex:stale-build-reload-at';
const STALE_BUILD_RELOAD_GUARD_MS = 60_000;

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

function isLikelyStaleBuildError(error: unknown): boolean {
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

function tryReloadForStaleBuild(): boolean {
  if (typeof window === 'undefined') return false;
  const now = Date.now();
  const previousRaw = window.sessionStorage.getItem(STALE_BUILD_RELOAD_GUARD_KEY);
  const previous = previousRaw ? Number(previousRaw) : 0;

  if (Number.isFinite(previous) && previous > 0 && now - previous < STALE_BUILD_RELOAD_GUARD_MS) {
    return false;
  }

  window.sessionStorage.setItem(STALE_BUILD_RELOAD_GUARD_KEY, String(now));
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('__hard_reload', String(now));
  window.location.replace(nextUrl.toString());
  return true;
}

function readMessage(error: unknown): string {
  if (!error) return 'Something went wrong';

  if (typeof error === 'string') return error;

  if (error instanceof Error) return error.message || 'Something went wrong';

  const err = error as ErrorLike;

  const topMessage = err.message;
  if (typeof topMessage === 'string' && topMessage.trim()) return topMessage;

  const firstStructured = err.errors?.[0];
  if (firstStructured?.description) return firstStructured.description;
  if (firstStructured?.message) return firstStructured.message;

  if (err.data && typeof err.data === 'object') {
    const data = err.data as Record<string, unknown>;
    if (typeof data.message === 'string' && data.message.trim()) return data.message;

    const nestedError = data.error;
    if (nestedError && typeof nestedError === 'object') {
      const nested = nestedError as Record<string, unknown>;
      if (typeof nested.message === 'string' && nested.message.trim()) return nested.message;
    }
  }

  if (typeof err.error === 'string' && err.error.trim()) return err.error;

  return 'Internal server error';
}

export function TheAduseiErrorResponse(error: unknown, fallbackMessage?: string) {
  const message = readMessage(error) || fallbackMessage || 'Something went wrong';
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
    if (isLikelyStaleBuildError(event.error ?? event.message)) {
      if (tryReloadForStaleBuild()) return;
    }
    TheAduseiErrorResponse(event.error ?? event.message ?? 'Unexpected error');
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (isLikelyStaleBuildError(event.reason)) {
      if (tryReloadForStaleBuild()) return;
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
