import { createPrintableHtmlDocument } from '@/features/printing';

const DESKTOP_THERMAL_STICKER_PAGE_STYLE = `
  @media print {
    @page {
      size: 100mm 100mm;
      margin: 0;
    }

    html,
    body {
      width: 100mm;
      height: 100mm;
      margin: 0;
      padding: 0;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .desktop-sticker-page {
      position: relative;
      width: 100mm;
      height: 100mm;
      overflow: hidden;
      display: grid;
      align-items: start;
      justify-items: center;
      padding-top: 2.5mm;
      box-sizing: border-box;
    }

    .desktop-sticker-content {
      position: static;
      transform-origin: top left;
    }

    .desktop-sticker-page--portrait .desktop-sticker-content {
      transform: none;
    }

    .desktop-sticker-page--landscape .desktop-sticker-content {
      transform: none;
    }
  }
`;

type DesktopStickerPrintOrientation = 'landscape' | 'portrait';

export function createDesktopStickerHtml({
  orientation = 'portrait',
  title,
  stickerNode,
}: {
  orientation?: DesktopStickerPrintOrientation;
  title: string;
  stickerNode: HTMLDivElement;
}) {
  const printableSticker = stickerNode.cloneNode(true) as HTMLDivElement;
  const sourceCanvases = Array.from(stickerNode.querySelectorAll('canvas'));
  const clonedCanvases = Array.from(printableSticker.querySelectorAll('canvas'));
  const sourceImages = Array.from(stickerNode.querySelectorAll('img'));
  const clonedImages = Array.from(printableSticker.querySelectorAll('img'));

  sourceCanvases.forEach((canvas, index) => {
    const clonedCanvas = clonedCanvases[index];
    if (!clonedCanvas) return;

    const image = document.createElement('img');
    image.src = canvas.toDataURL('image/png');
    image.width = canvas.width;
    image.height = canvas.height;
    image.style.cssText = clonedCanvas.getAttribute('style') ?? '';
    clonedCanvas.replaceWith(image);
  });

  sourceImages.forEach((image, index) => {
    const clonedImage = clonedImages[index];
    if (!clonedImage) return;

    clonedImage.src = image.currentSrc || image.src;
  });

  return createPrintableHtmlDocument({
    title,
    pageStyle: DESKTOP_THERMAL_STICKER_PAGE_STYLE,
    bodyHtml: `<div class="desktop-sticker-page desktop-sticker-page--${orientation}"><div class="desktop-sticker-content">${printableSticker.outerHTML}</div></div>`,
  });
}
