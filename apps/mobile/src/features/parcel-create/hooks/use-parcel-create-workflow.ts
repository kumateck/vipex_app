import { useParcelBookingSubmit } from './use-parcel-booking-submit';
import { useParcelChargeExemption } from './use-parcel-charge-exemption';

import { useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { canCreateParcelBooking } from '@mobile/lib/permissions';
import { BranchType } from '@mobile/constants/branch';

import { useCustomerLookup } from '../use-customer-lookup';

import { type MobilePaymentResponsibility } from '../mobile-parcel-payment-plan';

import { useMobileStickerPrint } from './use-mobile-sticker-print';
import { useParcelBranchOptions } from './use-parcel-branch-options';

import { useParcelChargeAgents } from './use-parcel-charge-agents';
import { getRequiredPickupLocationError } from '@/shared/shipments/pickup-location';

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
  const exemption = useParcelChargeExemption(
    sender.customerType,
    receiver.customerType,
    destinationBranchId,
  );
  const isExempt = exemption.exemptionType != null;
  const [selectedPickupLocationId, setPickupLocationId] = useState('');
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
  const {
    branchOptions,
    isLoadingBranches,
    locationOptions,
    isLoadingLocations,
    locationsFailed,
    retryLocations,
  } = useParcelBranchOptions(companyId, destinationBranchId, canCreate, isHeadOffice);
  const pickupLocationId = locationOptions.some(
    (location) => location.id === selectedPickupLocationId,
  )
    ? selectedPickupLocationId
    : locationOptions.length === 1
      ? locationOptions[0]!.id
      : '';
  const pickupLocationError = getRequiredPickupLocationError({
    destinationId: destinationBranchId,
    pickupLocationId,
    options: locationOptions,
    loading: isLoadingLocations,
    failed: locationsFailed,
  });
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
  const submitState = {
    session,
    withAuth,
    companyId,
    userBranchId,
    sender,
    receiver,
    destinationBranchId,
    exemption,
    isExempt,
    parcelDetails,
    parcelContent,
    parcelValue,
    charge,
    chargeAgentUserId,
    chargeAgents,
    callSender,
    paymentResponsibility,
    branchOptions,
    locationOptions,
    pickupLocationId,
    pickupLocationError,
    isSubmitting,
    setIsSubmitting,
    printSticker,
    stickerCopies,
    stickerPrint,
    resetForm,
  };
  const handleSubmit = useParcelBookingSubmit(submitState);
  const applyUpdatedCustomer = (customer: { id: string; fullname: string }) => {
    sender.applyUpdatedCustomer(customer);
    receiver.applyUpdatedCustomer(customer);
  };
  return {
    submitState,
    exemption,
    canCreate,
    isHeadOffice,
    userBranchId,
    sender: { ...sender, applyUpdatedCustomer },
    receiver: { ...receiver, applyUpdatedCustomer },
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
    pickupLocationError,
    locationsFailed,
    retryLocations,
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

export type ParcelCreateSubmitState = ReturnType<typeof useParcelCreateWorkflow>['submitState'];
