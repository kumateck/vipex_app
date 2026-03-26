export function getRuntimePlatformLabel() {
  if (typeof navigator === 'undefined') {
    return 'server';
  }

  return navigator.userAgent;
}
