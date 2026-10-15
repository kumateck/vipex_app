import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConsignmentPrintDocument } from './consignment-print-document';

const payload = { consignmentCode: 'CONSIGN1', destinationName: 'Accra', items: [] };

test('marks saved consignment reprints without marking original manifests', () => {
  expect(renderToStaticMarkup(<ConsignmentPrintDocument payload={payload} duplicate />)).toContain(
    'DUPLICATE',
  );
  expect(renderToStaticMarkup(<ConsignmentPrintDocument payload={payload} />)).not.toContain(
    'DUPLICATE',
  );
});
