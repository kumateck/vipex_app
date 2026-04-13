import { Alert, Platform, ToastAndroid } from 'react-native';

export type NotifyVariant = 'success' | 'warning' | 'error';

type NotifyPayload = {
  title?: string;
  message: string;
  variant: NotifyVariant;
};

type NotifyHandler = (payload: NotifyPayload) => void;

let activeNotifyHandler: NotifyHandler | null = null;

export function registerNotifyHandler(handler: NotifyHandler) {
  activeNotifyHandler = handler;
}

export function unregisterNotifyHandler(handler: NotifyHandler) {
  if (activeNotifyHandler === handler) {
    activeNotifyHandler = null;
  }
}

function fallbackNotify(payload: NotifyPayload) {
  const heading =
    payload.title ??
    (payload.variant === 'success'
      ? 'Success'
      : payload.variant === 'warning'
        ? 'Warning'
        : 'Error');
  const text = payload.message.trim().length > 0 ? payload.message : heading;
  if (Platform.OS === 'android') {
    ToastAndroid.show(`${heading}: ${text}`, ToastAndroid.SHORT);
    return;
  }
  Alert.alert(heading, text);
}

function pushNotify(payload: NotifyPayload) {
  if (activeNotifyHandler) {
    activeNotifyHandler(payload);
    return;
  }
  fallbackNotify(payload);
}

function sanitizeErrorMessage(message: string) {
  const cleaned = message
    .replace(/\s+at\s+https?:\/\/\S+/gi, '')
    .replace(/\s+at\s+\/v\d+\/\S+/gi, '')
    .replace(/\s+\(endpoint:\s*https?:\/\/[^)]+\)/gi, '')
    .trim();
  return cleaned.length > 0 ? cleaned : 'Something went wrong.';
}

export function notifySuccess(message: string, title = 'Success') {
  pushNotify({ variant: 'success', title, message });
}

export function notifyWarning(message: string, title = 'Warning') {
  pushNotify({ variant: 'warning', title, message });
}

export function notifyError(title: string, message: string) {
  pushNotify({ variant: 'error', title, message: sanitizeErrorMessage(message) });
}
