import type { WebContents } from 'electron';
import { waitForPrintImages } from '../../../../src/shared/printing/wait-for-print-images';

export async function preparePrintAssets(contents: Pick<WebContents, 'executeJavaScript'>) {
  await contents.executeJavaScript(`(${waitForPrintImages.toString()})(document)`);
}
