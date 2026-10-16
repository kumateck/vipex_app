import { useCallback } from 'react';
import { SendReceiptAction } from '@/features/digital-receipts';
import { ParcelDetailsDialog } from '@/features/operations/parcel-details';
import type { ParcelFullDetails, ParcelSearchRow } from '../../api/parcel.api';
import { ParcelSuperSearchDispositionCard } from './parcel-super-search-disposition-card';
import { ReturnToSourceAction } from './return-to-source-action';

type ParcelSuperSearchDetailsDialogProps = {
  parcelId: string | null;
  companyId: string | null;
  branchNameById: Map<string, string>;
  selectedParcelRow?: ParcelSearchRow;
  onClose: () => void;
  canRecordReturn: boolean;
  branchId: string | null;
  onReturnToSource: (parcel: { id: string; bookingCode: string; sourceName: string }) => void;
};

/** The shared parcel details view plus Super Search's return-to-source and disposition actions. */
export function ParcelSuperSearchDetailsDialog({
  parcelId,
  companyId,
  branchNameById,
  onClose,
  canRecordReturn,
  branchId,
  onReturnToSource,
}: ParcelSuperSearchDetailsDialogProps) {
  const renderBanner = useCallback(
    (details: ParcelFullDetails) => (
      <>
        <SendReceiptAction
          key={details.parcel.id}
          parcelId={details.parcel.id}
          bookingCode={details.parcel.bookingCode}
          isDeleted={details.parcel.isDeleted}
        />
        <ReturnToSourceAction
          parcel={details.parcel}
          branchId={branchId}
          sourceName={
            details.summary?.sourceName ??
            branchNameById.get(details.parcel.sourceId) ??
            'source branch'
          }
          canRecordReturn={canRecordReturn}
          onReturnToSource={onReturnToSource}
        />
      </>
    ),
    [branchId, branchNameById, canRecordReturn, onReturnToSource],
  );
  const renderActions = useCallback(
    (details: ParcelFullDetails) => (
      <ParcelSuperSearchDispositionCard
        parcelId={details.parcel.id}
        companyId={companyId}
        destinationBranchId={details.parcel.destinationId}
        dispositionActions={details.dispositionActions}
      />
    ),
    [companyId],
  );

  return (
    <ParcelDetailsDialog
      parcelId={parcelId}
      onClose={onClose}
      renderBanner={renderBanner}
      renderActions={renderActions}
    />
  );
}
