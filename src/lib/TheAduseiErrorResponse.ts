import { toast } from 'sonner';

type ErrorLike = {
  message?: string;
  status?: number;
  data?: unknown;
  error?: unknown;
  errors?: Array<{ description?: string; message?: string }>;
};

let lastToast = { message: '', at: 0 };

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
    TheAduseiErrorResponse(event.error ?? event.message ?? 'Unexpected error');
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
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
