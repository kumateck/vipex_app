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

      const { stickerPrinter } = getPrinterPreferenceMapping();
      const stickerHtml = createDesktopStickerHtml({
        orientation: 'portrait',
        title: `sticker-${bookingCode}`,
        stickerNode,
      });
      const result = await printViaDesktop({
        html: stickerHtml,
        layout: 'thermal-sticker',
        title: `sticker-${bookingCode}`,
        silent: false,
        deviceName: stickerPrinter || undefined,
        copies: Math.max(Math.trunc(copies), 1),
      });

      if (!result.ok) {
        toast.error(result.reason ?? 'Failed to print parcel sticker');
      }

      return result.ok;
    },
    [bookingCode, canPrintStickerViaDesktop, stickerRef],
  );
}
