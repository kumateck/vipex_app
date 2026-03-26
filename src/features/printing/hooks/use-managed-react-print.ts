import type { RefObject } from 'react';
import { useReactToPrint } from 'react-to-print';

type UseManagedReactPrintOptions = {
  contentRef: RefObject<Element | Text | null>;
  documentTitle: string;
  pageStyle: string;
  onAfterPrint?: () => void;
};

async function waitForImages(root: Element | Text | null) {
  if (!root || !(root instanceof Element)) return;

  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map(async (image) => {
      if (image.complete) return;
      try {
        await image.decode();
      } catch {
        // Best effort: broken image should not block printing.
      }
    }),
  );
}

export function useManagedReactPrint(options: UseManagedReactPrintOptions) {
  const { contentRef, documentTitle, pageStyle, onAfterPrint } = options;

  return useReactToPrint({
    contentRef,
    documentTitle,
    pageStyle,
    onBeforePrint: async () => {
      await waitForImages(contentRef.current);
    },
    onAfterPrint,
  });
}
