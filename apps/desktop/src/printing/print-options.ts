import type { WebContentsPrintOptions } from 'electron';
import type { DesktopPrintRequest } from '../../../../src/features/printing/types';
import { rollWidthForLayout } from '../../../../src/shared/printing/receipt-paper';

export function getPrintOptions(
  request: DesktopPrintRequest,
  receiptHeightMicrons = 297000,
): WebContentsPrintOptions {
  const baseOptions: WebContentsPrintOptions = {
    silent: Boolean(request.silent),
    printBackground: true,
    margins: {
      marginType: 'none',
    },
  };

  if (request.deviceName) {
    baseOptions.deviceName = request.deviceName;
  }

  if (request.copies && request.copies > 1) {
    baseOptions.copies = request.copies;
  }

  if (request.layout === 'thermal-sticker') {
    baseOptions.pageSize = {
      width: 100000,
      height: 100000,
    };
    baseOptions.landscape = false;
    baseOptions.scaleFactor = 100;
    baseOptions.pagesPerSheet = 1;
    baseOptions.collate = false;
    baseOptions.duplexMode = 'simplex';
    baseOptions.pageRanges = [{ from: 0, to: 0 }];
    baseOptions.margins = {
      marginType: 'none',
    };
  }

  const width = rollWidthForLayout(request.layout);
  if (width) {
    baseOptions.pageSize = { width: width * 1000, height: receiptHeightMicrons };
    baseOptions.landscape = false;
    baseOptions.scaleFactor = 100;
    baseOptions.pagesPerSheet = 1;
    baseOptions.duplexMode = 'simplex';
    baseOptions.color = false;
  }

  if (request.layout === 'invoice-a5' || request.layout === 'invoice-a5-receipt') {
    baseOptions.pageSize = 'A5';
    if (request.layout === 'invoice-a5-receipt') {
      baseOptions.landscape = true;
    }
  } else if (request.layout === 'report-a4') {
    baseOptions.pageSize = 'A4';
  }

  return baseOptions;
}
