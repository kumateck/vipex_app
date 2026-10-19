import type {
  DesktopParallelPrintRequest,
  DesktopParallelPrintResult,
  DesktopPrintRequest,
  DesktopPrintResult,
  PrintRuntime,
} from '../types';
import { getPreferredPrinterForLayout } from './printer-preferences';
import { receiptLayoutFromHtml } from '@/shared/printing/receipt-paper';

function applyPreferredPrinter(request: DesktopPrintRequest): DesktopPrintRequest {
  if (request.layout === 'invoice-a5-receipt') {
    const layout = receiptLayoutFromHtml(request.html);
    if (layout) request = { ...request, layout };
  }
  if (request.deviceName) return request;
  const deviceName = getPreferredPrinterForLayout(request.layout);
  return deviceName ? { ...request, deviceName, silent: true } : request;
}

export function getPrintRuntime(): PrintRuntime {
  if (typeof window !== 'undefined' && typeof window.api?.printHtml === 'function') {
    return 'desktop';
  }

  return 'web';
}

export async function printViaDesktop(request: DesktopPrintRequest): Promise<DesktopPrintResult> {
  if (typeof window === 'undefined' || typeof window.api?.printHtml !== 'function') {
    return { ok: false, reason: 'Desktop print bridge unavailable' };
  }

  return window.api.printHtml(applyPreferredPrinter(request));
}

export async function printParallelViaDesktop(
  request: DesktopParallelPrintRequest,
): Promise<DesktopParallelPrintResult> {
  if (typeof window === 'undefined' || typeof window.api?.printParallel !== 'function') {
    return {
      ok: false,
      jobs: request.jobs.map((job) => ({
        ok: false,
        reason: 'Desktop parallel print bridge unavailable',
        layout: job.layout,
        deviceName: job.deviceName,
        title: job.title,
      })),
    };
  }

  return window.api.printParallel({
    jobs: request.jobs.map(applyPreferredPrinter),
  });
}

export async function listDesktopPrinters() {
  if (typeof window === 'undefined' || typeof window.api?.listPrinters !== 'function') {
    return [];
  }

  return window.api.listPrinters();
}
