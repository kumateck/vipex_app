import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { canCreateParcelBooking } from '@mobile/lib/permissions';
import { BranchType } from '@mobile/constants/branch';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import { PaymentResponsibility } from '@mobile/constants/payment';
import {
  createBookingWithParcels,
  createCustomer,
  findCustomersByTelephone,
} from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { hapticError, hapticSuccess } from '@mobile/lib/haptics';
import { isTenDigitPhone, useCustomerLookup } from '../use-customer-lookup';
import { resolveBookingCustomer } from '../resolve-booking-customer';
import {
  buildMobileParcelPaymentPlan,
  type MobilePaymentResponsibility,
} from '../mobile-parcel-payment-plan';
import type { MobileSticker } from '../services';
import { useMobileStickerPrint } from './use-mobile-sticker-print';
import { useParcelBranchOptions } from './use-parcel-branch-options';
import { parseAmount } from '../utils';
import { useParcelChargeAgents } from './use-parcel-charge-agents';

export function useParcelCreateWorkflow(initialPaymentResponsibility: MobilePaymentResponsibility) {
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canCreate = canCreateParcelBooking(permissions);
  const branchType = session.user?.branchType ?? session.user?.branch?.type ?? null;
  const isHeadOffice = branchType === BranchType.HEADOFFICE;
  const companyId = session.user?.company?.id ?? session.user?.companyId ?? null;
  const userBranchId = session.user?.branch?.id ?? session.user?.branchId ?? null;
  const sender = useCustomerLookup(withAuth);
  const receiver = useCustomerLookup(withAuth);
  const [destinationBranchId, setDestinationBranchId] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [parcelDetails, setParcelDetails] = useState('');
  const [parcelContent, setParcelContent] = useState('');
  const [parcelValue, setParcelValue] = useState('');
  const [charge, setCharge] = useState('');
  const [chargeAgentUserId, setChargeAgentUserId] = useState('');
  const chargeAgents = useParcelChargeAgents('booking', canCreate && !isHeadOffice);
  const [callSender, setCallSender] = useState(false);
  const [paymentResponsibility, setPaymentResponsibility] = useState<MobilePaymentResponsibility>(
    initialPaymentResponsibility,
  );
  const { branchOptions, isLoadingBranches, locationOptions, isLoadingLocations } =
    useParcelBranchOptions(companyId, destinationBranchId, canCreate, isHeadOffice);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printSticker, setPrintSticker] = useState(false);
  const [stickerCopies, setStickerCopies] = useState('1');
  const stickerPrint = useMobileStickerPrint();
  const resetForm = () => {
    sender.reset();
    receiver.reset();
    setDestinationBranchId('');
    setPickupLocationId('');
    setParcelDetails('');
    setParcelContent('');
    setParcelValue('');
    setCharge('');
    setChargeAgentUserId('');
    setCallSender(false);
    setPaymentResponsibility(initialPaymentResponsibility);
    setPrintSticker(false);
    setStickerCopies('1');
  };
  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!companyId || !userBranchId)
      return notifyError('Missing context', 'Your company or branch is missing.');
    if (!chargeAgents.options.some((agent) => agent.value === chargeAgentUserId))
      return notifyError('Charge agent required', 'Select the agent who charged the parcel.');
    if (!isTenDigitPhone(sender.telephone))
      return notifyError('Sender required', 'Enter the sender telephone.');
    if (sender.telephone2 && !isTenDigitPhone(sender.telephone2))
      return notifyError('Invalid sender number', 'Telephone 2 must have 10 digits.');
    if (!isTenDigitPhone(receiver.telephone))
      return notifyError('Receiver required', 'Enter the receiver telephone.');
    if (receiver.telephone2 && !isTenDigitPhone(receiver.telephone2))
      return notifyError('Invalid receiver number', 'Telephone 2 must have 10 digits.');
    if (!destinationBranchId)
      return notifyError('Destination required', 'Select a destination branch.');
    if (!parcelDetails.trim())
      return notifyError('Parcel details required', 'Describe the parcel.');
    if (!parcelContent.trim())
      return notifyError('Parcel content required', 'Describe the parcel content.');
    const chargeAmount = parseAmount(charge);
    if (chargeAmount === null || chargeAmount <= 0)
      return notifyError('Invalid charge', 'Enter a valid charge amount.');
    const valueAmount = parseAmount(parcelValue) ?? 0;
    const copies = Number(stickerCopies);
    if (
      printSticker &&
      paymentResponsibility === PaymentResponsibility.RECIPIENT &&
      (!Number.isSafeInteger(copies) || copies < 1)
    )
      return notifyError(
        'Invalid sticker copies',
        'Enter a positive whole number of sticker copies.',
      );

    setIsSubmitting(true);
    try {
      const customerDependencies = {
        find: (telephone: string) =>
          withAuth((token) => findCustomersByTelephone(token, { telephone })),
        create: (input: { fullname: string; telephone: string; telephone2: string | null }) =>
          withAuth((token) => createCustomer(token, input)),
      };
      const [senderId, receiverId] = await Promise.all([
        resolveBookingCustomer(sender, 'Sender', customerDependencies),
        resolveBookingCustomer(receiver, 'Recipient', customerDependencies),
      ]);
      const response = await withAuth((token) =>
        createBookingWithParcels(token, {
          senderId,
          status: ParcelStatus.CREATED,
          deferSenderCashierCompletion: !(
            printSticker && paymentResponsibility === PaymentResponsibility.RECIPIENT
          ),
          completeToBePaid:
            printSticker && paymentResponsibility === PaymentResponsibility.RECIPIENT,
          parcels: [
            {
              destinationId: destinationBranchId,
              pickupLocationId: pickupLocationId || null,
              receiverId,
              status: ParcelStatus.CREATED,
              parcelDetails: parcelDetails.trim(),
              parcelContent: parcelContent.trim(),
              parcelValueCedis: valueAmount,
              chargeCedis: chargeAmount,
              chargeAgentUserId,
              callSender,
              ...buildMobileParcelPaymentPlan(paymentResponsibility, chargeAmount),
            },
          ],
        }),
      );
      const created = response.parcels[0];
      let printCompleted = true;
      if (printSticker && created) {
        const sticker: MobileSticker = {
          bookingCode: created.bookingCode,
          trackingCode: created.trackingCode,
          senderName: sender.fullname,
          senderPhone: [sender.telephone, sender.telephone2].filter(Boolean).join(' / '),
          receiverName: receiver.fullname,
          receiverPhone: [receiver.telephone, receiver.telephone2].filter(Boolean).join(' / '),
          destinationBranch:
            branchOptions.find((branch) => branch.id === destinationBranchId)?.name ?? '-',
          destinationLocation:
            locationOptions.find((location) => location.id === pickupLocationId)?.name ?? '-',
          parcelDetails: parcelDetails.trim(),
          amountCedis: paymentResponsibility === PaymentResponsibility.RECIPIENT ? chargeAmount : 0,
          callSender,
          copies,
        };
        printCompleted = await stickerPrint.print(sticker);
      }
      if (printCompleted)
        notifySuccess(
          printSticker
            ? `Booking ${created?.bookingCode ?? response.bookingId} completed in the cashier session.`
            : `Booking ${created?.bookingCode ?? response.bookingId} queued for Sender Cashier Payments.`,
          printSticker ? 'To-be-paid parcel completed' : 'Parcel queued for sender cashier',
        );
      void hapticSuccess();
      resetForm();
    } catch (error) {
      notifyError(
        'Failed to create parcel',
        getMobileErrorMessage(error, '') || 'Please try again',
      );
      void hapticError();
    } finally {
      setIsSubmitting(false);
    }
  };
  return {
    canCreate,
    isHeadOffice,
    userBranchId,
    sender,
    receiver,
    destinationBranchId,
    setDestinationBranchId,
    pickupLocationId,
    setPickupLocationId,
    parcelDetails,
    setParcelDetails,
    parcelContent,
    setParcelContent,
    parcelValue,
    setParcelValue,
    charge,
    setCharge,
    callSender,
    setCallSender,
    paymentResponsibility,
    setPaymentResponsibility,
    branchOptions,
    isLoadingBranches,
    locationOptions,
    isLoadingLocations,
    isSubmitting,
    printSticker,
    setPrintSticker,
    stickerCopies,
    setStickerCopies,
    stickerPrint,
    handleSubmit,
    chargeAgent: {
      value: chargeAgentUserId,
      onChange: setChargeAgentUserId,
      options: chargeAgents.options,
      loading: chargeAgents.loading,
      failed: chargeAgents.failed,
      onRetry: chargeAgents.retry,
    },
  };
}
