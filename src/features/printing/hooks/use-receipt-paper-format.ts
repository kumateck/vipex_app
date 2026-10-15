import { useSyncExternalStore } from 'react';
import {
  getReceiptPaperFormat,
  PRINTER_PREFERENCES_CHANGED,
} from '../services/printer-preferences';
import type { ReceiptPaperFormat } from '@/shared/printing/receipt-paper';

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener(PRINTER_PREFERENCES_CHANGED, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(PRINTER_PREFERENCES_CHANGED, listener);
  };
}
const serverSnapshot = (): ReceiptPaperFormat => 'a5';
export function useReceiptPaperFormat() {
  return useSyncExternalStore(subscribe, getReceiptPaperFormat, serverSnapshot);
}
