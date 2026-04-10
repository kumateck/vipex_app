export const SCREEN_TIMEOUT_OPTIONS_MINUTES = [0, 15, 30, 45, 60, 120, 360, 1200, 1440] as const;

export type ScreenTimeoutMinutes = (typeof SCREEN_TIMEOUT_OPTIONS_MINUTES)[number];

export function formatScreenTimeoutLabel(minutes: number) {
  if (minutes <= 0) return 'No timeout';
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
