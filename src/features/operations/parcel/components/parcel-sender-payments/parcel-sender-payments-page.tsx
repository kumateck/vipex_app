import { ParcelReceiptActions } from '../parcel-receipt-actions';
import { ParcelSessionGuard } from '../parcel-session-guard';
import { CollectSenderPaymentDialog } from './collect-sender-payment-dialog';
import { DeleteSenderParcelDialog } from './delete-sender-parcel-dialog';
import { RequestReconciliationCaseDialog } from './request-reconciliation-case-dialog';
import { SenderPaymentsTable } from './sender-payments-table';
import { useSenderPaymentsWorkflow } from './use-sender-payments-workflow';

export function ParcelSenderPaymentsPage() {
  const {
    setQuery,
    companyId,
    branchId,
    canDeleteParcel,
    canRequestReconciliation,
    data,
    isLoading,
    selectedParcel,
    closeCollectPayment,
    amount,
    setAmount,
    paymentMethod,
    setPaymentMethod,
    momoTransactionId,
    setMomoTransactionId,
    isSubmitting,
    handleCollectPayment,
    deleteTargetParcel,
    deleteReason,
    setDeleteReason,
    isDeletingParcel,
    closeDeleteParcel,
    handleDeleteParcel,
    reconTargetParcel,
    reconCaseType,
    reconActionType,
    reconLinkedParcelId,
    reconEvidenceUrl,
    reconEvidenceFiles,
    reconNotes,
    isRequestingReconciliation,
    isUploadingEvidence,
    handleReconciliationCaseTypeChange,
    setReconActionType,
    setReconLinkedParcelId,
    setReconEvidenceUrl,
    setReconEvidenceFiles,
    setReconNotes,
    closeReconciliationCase,
    handleRequestReconciliation,
    openCollectPayment,
    openDeleteParcel,
    openReconciliationCase,
    pickupLocationName,
    lastPrintedReceipt,
    clearLastPrintedReceipt,
  } = useSenderPaymentsWorkflow();

  return (
    <div className="w-full space-y-4 p-4">
      <ParcelSessionGuard>
        <SenderPaymentsTable
          data={data?.data ?? []}
          meta={data?.meta}
          loading={isLoading}
          companyId={companyId}
          branchId={branchId}
          canDeleteParcel={canDeleteParcel}
          canRequestReconciliation={canRequestReconciliation}
          onRequestChange={setQuery}
          onOpenCollectPayment={openCollectPayment}
          onOpenDeleteParcel={openDeleteParcel}
          onOpenReconciliationCase={openReconciliationCase}
        />

        <CollectSenderPaymentDialog
          parcel={selectedParcel}
          pickupLocationName={pickupLocationName}
          amount={amount}
          onAmountChange={setAmount}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          momoTransactionId={momoTransactionId}
          onMomoConfirmed={setMomoTransactionId}
          isSubmitting={isSubmitting}
          onClose={closeCollectPayment}
          onSubmit={handleCollectPayment}
        />

        <DeleteSenderParcelDialog
          parcel={deleteTargetParcel}
          reason={deleteReason}
          onReasonChange={setDeleteReason}
          isDeleting={isDeletingParcel}
          onClose={closeDeleteParcel}
          onConfirm={handleDeleteParcel}
        />

        <RequestReconciliationCaseDialog
          parcel={reconTargetParcel}
          caseType={reconCaseType}
          actionType={reconActionType}
          linkedParcelId={reconLinkedParcelId}
          evidenceUrl={reconEvidenceUrl}
          evidenceFiles={reconEvidenceFiles}
          notes={reconNotes}
          isSubmitting={isRequestingReconciliation}
          isUploadingEvidence={isUploadingEvidence}
          onCaseTypeChange={handleReconciliationCaseTypeChange}
          onActionTypeChange={setReconActionType}
          onLinkedParcelIdChange={setReconLinkedParcelId}
          onEvidenceUrlChange={setReconEvidenceUrl}
          onEvidenceFilesChange={setReconEvidenceFiles}
          onNotesChange={setReconNotes}
          onClose={closeReconciliationCase}
          onSubmit={handleRequestReconciliation}
        />

        {lastPrintedReceipt ? (
          <ParcelReceiptActions
            data={lastPrintedReceipt}
            autoPrint
            autoPrintSelection="both"
            mode="sender-payment"
            onAutoPrintComplete={clearLastPrintedReceipt}
          />
        ) : null}
      </ParcelSessionGuard>
    </div>
  );
}
