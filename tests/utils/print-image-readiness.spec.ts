import { describe, expect, test } from 'bun:test';
import { waitForPrintImages } from '@/shared/printing/wait-for-print-images';
import { preparePrintAssets } from '../../apps/desktop/src/printing/print-assets';

function rootWith(images: Partial<HTMLImageElement>[], fonts = Promise.resolve()) {
  return { querySelectorAll: () => images, fonts: { ready: fonts } } as unknown as Document;
}
const loaded = { complete: true, naturalWidth: 50, naturalHeight: 50, alt: 'Vipex logo' };

describe('print asset readiness', () => {
  test('accepts decoded embedded images and documents with no images', async () => {
    await expect(waitForPrintImages(rootWith([loaded]))).resolves.toBeUndefined();
    await expect(waitForPrintImages(rootWith([]))).resolves.toBeUndefined();
  });
  test('waits for delayed image decode and fonts before allowing the print', async () => {
    let resolveImage!: () => void;
    let resolveFonts!: () => void;
    const image = {
      ...loaded,
      complete: false,
      naturalWidth: 0,
      decode: () =>
        new Promise<void>((resolve) => {
          resolveImage = () => {
            image.complete = true;
            image.naturalWidth = 50;
            resolve();
          };
        }),
    };
    let ready = false;
    const pending = waitForPrintImages(
      rootWith(
        [image],
        new Promise((resolve) => {
          resolveFonts = resolve;
        }),
      ),
    ).then(() => {
      ready = true;
    });
    await Promise.resolve();
    expect(ready).toBe(false);
    resolveImage();
    await Promise.resolve();
    expect(ready).toBe(false);
    resolveFonts();
    await pending;
    expect(ready).toBe(true);
  });
  test('rejects a completed but broken logo and a failed decode', async () => {
    await expect(waitForPrintImages(rootWith([{ ...loaded, naturalWidth: 0 }]))).rejects.toThrow(
      'Vipex logo',
    );
    await expect(
      waitForPrintImages(
        rootWith([
          { ...loaded, complete: false, decode: () => Promise.reject(new Error('decode failed')) },
        ]),
      ),
    ).rejects.toThrow('decode failed');
  });
  test('times out a pending image or font rather than printing without artwork', async () => {
    await expect(
      waitForPrintImages(
        rootWith([{ ...loaded, complete: false, decode: () => new Promise(() => {}) }]),
        5,
      ),
    ).rejects.toThrow('did not load in time');
    await expect(waitForPrintImages(rootWith([], new Promise(() => {})), 5)).rejects.toThrow(
      'did not load in time',
    );
  });
  test('native print preparation runs the same self-contained check in the isolated document', async () => {
    const document = rootWith([loaded]);
    let executed = false;
    await preparePrintAssets({
      executeJavaScript: async (script: string) => {
        executed = true;
        return new Function('document', `return ${script}`)(document);
      },
    });
    expect(executed).toBe(true);
    await expect(
      preparePrintAssets({
        executeJavaScript: async () => {
          throw new Error('Print image could not be loaded');
        },
      }),
    ).rejects.toThrow('Print image');
  });
});
