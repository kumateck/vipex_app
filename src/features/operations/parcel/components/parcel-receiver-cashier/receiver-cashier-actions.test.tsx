import { expect, test } from 'bun:test';
import { isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CellContext } from '@tanstack/react-table';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { useParcelReceiverCashierColumns } from './use-parcel-receiver-cashier-columns';

function textContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(' ');
  if (isValidElement<{ children?: ReactNode }>(node)) return textContent(node.props.children);
  return '';
}

function actionLabels(status: number) {
  let labels = '';
  function Probe() {
    const columns = useParcelReceiverCashierColumns({
      page: 1,
      pageSize: 20,
      isPickupQueueEnabled: false,
      isSaving: false,
      onOpenParcelDialog: () => {},
      onEdit: () => {},
      onRequestDelivery: () => {},
      onReprintReceipt: () => {},
    });
    const cell = columns.find((column) => column.id === 'action')?.cell;
    if (typeof cell === 'function') {
      labels = textContent(
        cell({ row: { original: { status } } } as CellContext<ParcelSearchRow, unknown>),
      );
    }
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return labels;
}

test('delivered cashier rows offer reprinting and no mutation actions', () => {
  const delivered = actionLabels(ParcelStatus.DELIVERED_BY_OFFICE);
  expect(delivered).toContain('Reprint Receipt');
  expect(delivered).not.toContain('Receive + Deliver');
  expect(delivered).not.toContain('Edit');
  expect(delivered).not.toContain('Request Delivery');
  const awaiting = actionLabels(ParcelStatus.AWAITING_PICKUP);
  expect(awaiting).toContain('Receive + Deliver');
  expect(awaiting).toContain('Edit');
  expect(awaiting).toContain('Request Delivery');
  expect(awaiting).not.toContain('Reprint Receipt');
});
