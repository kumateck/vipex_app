import { useCallback, type RefObject } from 'react';
import { toast } from 'sonner';
import { getPrinterPreferenceMapping, printViaDesktop } from '@/features/printing';
import { createDesktopStickerHtml } from './parcel-desktop-sticker-print';

type UseParcelDesktopStickerPrintParams = {
  bookingCode: string;
  canPrintStickerViaDesktop: boolean;
  stickerRef: RefObject<HTMLDivElement | null>;
};

export function useParcelDesktopStickerPrint({
  bookingCode,
  canPrintStickerViaDesktop,
  stickerRef,
}: UseParcelDesktopStickerPrintParams) {
  return useCallback(
    async (copies: number) => {
      if (!canPrintStickerViaDesktop) return false;

      const stickerNode = stickerRef.current;
      if (!stickerNode) return false;

      const stickerHtml = createDesktopStickerHtml({
        orientation: 'portrait',
        title: `sticker-${bookingCode}`,
        stickerNode,
      });
      const { stickerPrinter } = getPrinterPreferenceMapping();
      const request = {
        html: stickerHtml,
        layout: 'thermal-sticker',
        title: `sticker-${bookingCode}`,
        silent: Boolean(stickerPrinter),
        deviceName: stickerPrinter,
        copies: Math.max(Math.trunc(copies), 1),
      } as const;

      console.info('[parcel-sticker-print] desktop-request', {
        title: request.title,
        layout: request.layout,
        silent: request.silent,
        deviceName: request.deviceName ?? null,
        copies: request.copies,
        htmlLength: request.html.length,
      });

      const result = await printViaDesktop(request);
      console.info('[parcel-sticker-print] desktop-result', result);

      if (!result.ok) {
        console.error('[parcel-sticker-print] desktop-failed', result);
        toast.error(result.reason ?? 'Failed to print parcel sticker');
      }

      return result.ok;
    },
    [bookingCode, canPrintStickerViaDesktop, stickerRef],
  );
}
