import { useState } from 'react';
import { useHasPermission } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import { skipToken } from '@reduxjs/toolkit/query';
import { useParcelOtpAuthorizationQuery } from '../receiver-otp-exception';
import { isHandoverSignature } from '@/shared/shipments/handover-signature';
import { PickupVerificationActions } from './pickup-verification-actions';
import { PickupOtpExceptionSection } from './pickup-otp-exception-section';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { PickupMainCardSection } from './pickup-main-card-section';
import { PickupOtpVerificationSection } from './pickup-otp-verification-section';
import { PickupVerificationHandoverSection } from './pickup-verification-handover-section';
import { PickupVerificationDialogSkeleton } from './pickup-verification-dialog-skeleton';
import { ShelfPickupReassignmentLink } from '../parcel-shelf-pickup-reassignment';
import type { PickupVerificationDialogProps } from './pickup-verification-dialog-types';
export function PickupVerificationDialog({
  open,
  parcel,
  onClose,
  pickerStaffId,
  onPickerStaffIdChange,
  staffOptions,
  staffLocationName,
  isPickupQueueEnabled,
  isPickupOtpRequired,
  hasPickupQueue,
  parcelDetails,
  formatDateTime,
  mainCardMode,
  onMainCardModeChange,
  mainExistingCardRecordId,
  onMainExistingCardRecordIdChange,
  mainNewCardTypeId,
  onMainNewCardTypeIdChange,
  mainNewCardNumber,
  onMainNewCardNumberChange,
  mainReceiverCards,
  handoverTarget,
  onHandoverTargetChange,
  phoneSlot,
  onPhoneSlotChange,
  secondNewName,
  onSecondNewNameChange,
  secondNewPhone,
  onSecondNewPhoneChange,
  secondCardMode,
  onSecondCardModeChange,
  secondExistingCardRecordId,
  onSecondExistingCardRecordIdChange,
  secondNewCardTypeId,
  onSecondNewCardTypeIdChange,
  secondNewCardNumber,
  onSecondNewCardNumberChange,
  secondReceiverCards,
  cardOptions,
  otp,
  isSaving,
  isLoading,
  hasLoadError,
  onRequestHomeDelivery,
  onConfirmDelivered,
}: PickupVerificationDialogProps) {
  const canComplete = useHasPermission(PermissionKeys.CanCompleteOfficePickup);
  const showApproval = canComplete && open && isPickupOtpRequired && !otp.otpVerified;
  const approvalQuery = useParcelOtpAuthorizationQuery(
    showApproval && parcel
      ? {
          id: parcel.id,
          workflow: 'office_pickup',
          handoverTarget: handoverTarget === 'second' ? 'second' : 'main',
        }
      : skipToken,
    { refetchOnMountOrArgChange: true },
  );
  const approval = approvalQuery.isError ? null : (approvalQuery.currentData?.approval ?? null);
  const [signature, setSignature] = useState<{ approvalId: string; image: string } | null>(null);
  const exception =
    approval && signature?.approvalId === approval.id && isHandoverSignature(signature.image, true)
      ? { id: approval.id, signatureImage: signature.image }
      : undefined;
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-7xl sm:max-w-7xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pickup Verification</DialogTitle>
        </DialogHeader>
        {parcel && isLoading ? <PickupVerificationDialogSkeleton /> : null}
        {parcel && hasLoadError ? (
          <div
            className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm"
            role="alert"
          >
            <p className="font-medium">Unable to load pickup details</p>
            <p className="text-muted-foreground">Close this dialog and try opening it again.</p>
          </div>
        ) : null}
        {!parcel || isLoading || hasLoadError ? null : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <p>
                  <strong>Booking:</strong> {parcel.bookingCode}
                </p>
                <p>
                  <strong>Receiver:</strong> {parcel.receiverName ?? '-'} (
                  {parcel.receiverPhone ?? '-'})
                </p>
                <p>
                  <strong>Parcel:</strong> {parcel.parcelDetails}
                </p>
                <p>
                  <strong>Content:</strong> {parcel.parcelContent}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Shelf Picker Staff</Label>
                {pickerStaffId ? (
                  <div className="rounded-md border px-3 py-2 text-sm">
                    {staffOptions.find((staff) => staff.id === pickerStaffId)?.fullname ??
                      'Assigned shelf picker'}
                  </div>
                ) : (
                  <Select value={pickerStaffId} onValueChange={onPickerStaffIdChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffOptions.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.fullname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  {staffLocationName
                    ? `Only active staff assigned to ${staffLocationName} are shown.`
                    : 'Your user account needs an assigned location before staff can be selected.'}
                </p>
                {parcelDetails?.parcel.shelfPickerStaffId ||
                parcelDetails?.pickupQueue?.pickerStaffId ? (
                  <ShelfPickupReassignmentLink
                    bookingCode={parcel.bookingCode}
                    disabled={isSaving}
                  />
                ) : null}
              </div>
              <PickupMainCardSection
                mode={mainCardMode}
                onModeChange={onMainCardModeChange}
                existingCardRecordId={mainExistingCardRecordId}
                onExistingCardRecordIdChange={onMainExistingCardRecordIdChange}
                newCardTypeId={mainNewCardTypeId}
                onNewCardTypeIdChange={onMainNewCardTypeIdChange}
                newCardNumber={mainNewCardNumber}
                onNewCardNumberChange={onMainNewCardNumberChange}
                receiverCards={mainReceiverCards}
                cardOptions={cardOptions}
              />
            </div>

            <div className="space-y-4">
              {isPickupQueueEnabled ? (
                <div className="space-y-3 rounded-md border p-3">
                  <div>
                    <Label>Pickup Queue</Label>
                    <p className="text-sm text-muted-foreground">
                      Queue tickets are created from the Pickup Queue page before final handover.
                    </p>
                  </div>
                  {hasPickupQueue ? (
                    <div className="rounded-md bg-muted/40 p-3 text-sm">
                      <p>
                        <strong>Queue Code:</strong> {parcelDetails?.pickupQueue?.queueCode}
                      </p>
                      <p>
                        <strong>Queue Number:</strong> {parcelDetails?.pickupQueue?.queueNumber}
                      </p>
                      <p>
                        <strong>Queued At:</strong>{' '}
                        {formatDateTime(parcelDetails?.pickupQueue?.queuedAt ?? null)}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      No queue ticket found yet. Create it from the shared Pickup Queue page, then
                      return here to complete handover.
                    </div>
                  )}
                </div>
              ) : null}
              <PickupVerificationHandoverSection
                parcelSecondReceiverId={parcel.secondReceiverId}
                handoverTarget={handoverTarget}
                onHandoverTargetChange={(target) => {
                  setSignature(null);
                  onHandoverTargetChange(target);
                }}
                secondNewName={secondNewName}
                onSecondNewNameChange={onSecondNewNameChange}
                secondNewPhone={secondNewPhone}
                onSecondNewPhoneChange={onSecondNewPhoneChange}
                secondCardMode={secondCardMode}
                onSecondCardModeChange={onSecondCardModeChange}
                secondExistingCardRecordId={secondExistingCardRecordId}
                onSecondExistingCardRecordIdChange={onSecondExistingCardRecordIdChange}
                secondNewCardTypeId={secondNewCardTypeId}
                onSecondNewCardTypeIdChange={onSecondNewCardTypeIdChange}
                secondNewCardNumber={secondNewCardNumber}
                onSecondNewCardNumberChange={onSecondNewCardNumberChange}
                secondReceiverCards={secondReceiverCards}
                cardOptions={cardOptions}
              />
              {isPickupOtpRequired ? (
                <PickupOtpVerificationSection
                  otp={otp}
                  receiverPhone={parcel.receiverPhone}
                  receiverPhone2={parcel.receiverPhone2}
                  phoneSlot={phoneSlot}
                  onPhoneSlotChange={onPhoneSlotChange}
                />
              ) : (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <p className="font-medium">Pickup OTP is disabled for this branch</p>
                  <p className="text-muted-foreground">
                    Continue without OTP only when processing an approved legacy record.
                  </p>
                </div>
              )}
              {showApproval ? (
                <PickupOtpExceptionSection
                  approval={approval}
                  onCheck={approvalQuery.refetch}
                  checking={approvalQuery.isFetching}
                  error={approvalQuery.isError}
                  disabled={isSaving}
                  onSignatureChange={(image) =>
                    setSignature(approval ? { approvalId: approval.id, image } : null)
                  }
                />
              ) : null}
              {parcelDetails ? (
                <div className="rounded-md border p-3 text-sm">
                  <p>
                    <strong>Payments:</strong> {parcelDetails.payments.length}
                  </p>
                  <p>
                    <strong>Consignments:</strong> {parcelDetails.consignments.length}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}
        <PickupVerificationActions
          onClose={onClose}
          onRequestHomeDelivery={onRequestHomeDelivery}
          onConfirmDelivered={onConfirmDelivered}
          exception={exception}
          isLoading={isLoading}
          isSaving={isSaving}
          hasLoadError={hasLoadError}
          canConfirm={
            (!isPickupOtpRequired || otp.otpVerified || Boolean(exception)) &&
            (!isPickupQueueEnabled || hasPickupQueue)
          }
        />
      </DialogContent>
    </Dialog>
  );
}
