export async function waitForPrintImages(root: Element | Document, timeoutMs = 10000) {
  const images = Array.from(root.querySelectorAll('img'));
  const fonts = 'fonts' in root ? root.fonts : root.ownerDocument?.fonts;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const ready = Promise.all([
    fonts?.ready,
    ...images.map(async (image) => {
      if (!image.complete) await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error(`Print image could not be loaded: ${image.alt || 'document image'}`);
      }
    }),
  ]);
  try {
    await Promise.race([
      ready,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('Print images did not load in time')),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
