import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useConfirmTaxDataMutation, useExportTaxDataMutation } from '../services';
import type { useTaxData } from './use-tax-data';

export function useTaxDataActions(data: ReturnType<typeof useTaxData>) {
  const latestViewer = useRef(data.viewerKey);
  latestViewer.current = data.viewerKey;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exportData, exportState] = useExportTaxDataMutation();
  const [confirmData, confirmState] = useConfirmTaxDataMutation();
  const rows = data.selection.rows.map(({ parcelId, version }) => ({ parcelId, version }));
  const busy = exportState.isLoading || confirmState.isLoading;
  async function download() {
    if (!rows.length || busy) return;
    try {
      const blob = await exportData({ rows }).unwrap();
      if (latestViewer.current !== data.viewerKey) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `parcel-tax-data-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not export tax data'));
    }
  }
  async function confirm() {
    if (!data.canConfirm || !rows.length || busy) return;
    try {
      const result = await confirmData({ rows }).unwrap();
      if (latestViewer.current !== data.viewerKey) return;
      data.selection.replace(result.rows);
      setConfirmOpen(false);
      toast.success(
        `${result.confirmed} ${result.confirmed === 1 ? 'parcel' : 'parcels'} confirmed; ${result.alreadyConfirmed} already confirmed`,
      );
      data.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not confirm tax data'));
    }
  }
  return {
    confirmOpen,
    setConfirmOpen,
    download,
    confirm,
    busy,
    exporting: exportState.isLoading,
    confirming: confirmState.isLoading,
  };
}
