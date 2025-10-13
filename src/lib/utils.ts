import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeNumber(value: string | number | null | undefined): number {
  const num = Number(value);
  return isNaN(num) || value === null || value === undefined ? 0 : num;
}

export function sanitizeString(value: string | null | undefined | number): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  return String(value);
}
