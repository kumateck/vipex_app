import { createPrintableHtmlDocument } from '@/features/printing';

const DESKTOP_THERMAL_STICKER_PAGE_STYLE = `
  @media print {
    @page {
      size: 80mm 82mm;
      margin: 1mm;
    }

    html,
    body {
      width: 80mm;
      height: 82mm;
      margin: 0;
      padding: 0;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .desktop-sticker-page {
      position: relative;
      width: 80mm;
      height: 82mm;
      overflow: hidden;
    }

    .desktop-sticker-content {
      position: absolute;
      transform-origin: top left;
    }

    .desktop-sticker-page--portrait .desktop-sticker-content {
      top: 3.5mm;
      left: 2mm;
      transform: none;
    }

    .desktop-sticker-page--landscape .desktop-sticker-content {
      top: 1.25mm;
      left: 0;
      transform: translateX(80mm) rotate(90deg);
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
