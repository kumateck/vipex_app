import { useCallback, useRef, useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import {
  addPickupCustomerCard,
  loadPickupResources,
  markParcelDeliveredByOffice,
  requestParcelHomeDelivery,
  resolvePickupSecondReceiver,
  submitPickupHandover,
} from '../services';
import type { PhoneSlot, PickupContext, PickupParcel, PickupResources } from '../types';
import { getConfirmBlocker, getCurrentDayPickupQueue, resolveShelfPickerStaffId } from '../utils';
import { usePickupHandoverForm } from './use-pickup-handover-form';
import { usePickupOtpApproval } from './use-pickup-otp-approval';
import { usePickupOtp } from './use-pickup-otp';

export type CompletedPickup = { parcel: PickupParcel; collectedBy: string };

export function useOfficePickupHandover(input: {
  context: PickupContext;
  isPickupOtpRequired: boolean;
  isPickupQueueEnabled: boolean;
  isWhatsAppAvailable: boolean;
  onFinished: () => void;
}) {
  const { context, isPickupOtpRequired, isPickupQueueEnabled, onFinished } = input;
  const { withAuth } = useAuth();
  const [parcel, setParcel] = useState<PickupParcel | null>(null);
  const [resources, setResources] = useState<PickupResources | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const loadRequest = useRef(0);
  const [completed, setCompleted] = useState<CompletedPickup | null>(null);
  const [phoneSlot, setPhoneSlotState] = useState<PhoneSlot>('primary');
  const otp = usePickupOtp({
    parcelId: parcel?.id ?? null,
    phoneSlot,
    isWhatsAppAvailable: input.isWhatsAppAvailable,
    onPhoneSlotRestored: setPhoneSlotState,
  });
  const form = usePickupHandoverForm();
  const approval = usePickupOtpApproval(parcel?.id, form.handoverTarget);
  const { reset: resetApproval } = approval;
  const { reset: resetOtp, restore: restoreOtp } = otp;
  const { resetFor, setPickerStaffId, setSignatureImage } = form;

  const setPhoneSlot = useCallback((slot: PhoneSlot) => {
    setPhoneSlotState(slot);
  }, []);

  const open = useCallback(
    async (next: PickupParcel) => {
      const id = ++loadRequest.current;
      void restoreOtp(next.id);
      resetFor(next);
      setPhoneSlotState('primary');
      resetApproval();
      setCompleted(null);
      setParcel(next);
      setResources(null);
      setLoadError(false);
      setLoading(true);
      try {
        const loaded = await withAuth((token) =>
          loadPickupResources(token, next, context, isPickupQueueEnabled),
        );
        if (id !== loadRequest.current) return;
        setResources(loaded);
        setPickerStaffId(resolveShelfPickerStaffId(loaded.details));
      } catch (error) {
        if (id !== loadRequest.current) return;
        setLoadError(true);
        notifyError(
          'Unable to load pickup details',
          getMobileErrorMessage(error, '') || 'Go back and open the parcel again.',
        );
      } finally {
        if (id === loadRequest.current) setLoading(false);
      }
    },
    [
      context,
      isPickupQueueEnabled,
      resetApproval,
      resetFor,
      restoreOtp,
      setPickerStaffId,
      withAuth,
    ],
  );

  const close = useCallback(() => {
    loadRequest.current += 1;
    resetOtp();
    resetApproval();
    setSignatureImage('');
    setParcel(null);
    setResources(null);
    setCompleted(null);
  }, [resetApproval, resetOtp, setSignatureImage]);

  const hasPickupQueue = Boolean(resources && getCurrentDayPickupQueue(resources.details));
  const showOtpException = isPickupOtpRequired && !otp.verified;
  const otpAuthorizationId = showOtpException ? approval.approval?.id : undefined;
  const confirmBlocker = getConfirmBlocker({
    otpAuthorizationId,
    pickerStaffId: form.pickerStaffId,
    isPickupOtpRequired,
    otpVerified: otp.verified,
    verificationToken: otp.verificationToken,
    isPickupQueueEnabled,
    hasPickupQueue,
    signatureImage: form.signatureImage,
  });

  const confirm = useCallback(async () => {
    if (!parcel || !resources || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await withAuth((token) =>
        submitPickupHandover(
          {
            parcel,
            pickerStaffId: form.pickerStaffId,
            handoverTarget: form.handoverTarget,
            mainCard: form.mainCard,
            mainReceiverCards: resources.mainReceiverCards,
            secondCard: form.secondCard,
            secondReceiverCards: resources.secondReceiverCards,
            secondNewName: form.secondNewName,
            secondNewPhone: form.secondNewPhone,
            isPickupOtpRequired,
            otpVerified: otp.verified,
            otpAuthorizationId,
            verificationToken: otp.verificationToken,
            isPickupQueueEnabled,
            hasPickupQueue,
            signatureImage: form.signatureImage,
          },
          {
            addCustomerCard: (card) => addPickupCustomerCard(token, card),
            resolveSecondReceiver: (person) => resolvePickupSecondReceiver(token, person),
            markDelivered: (id, patch) => markParcelDeliveredByOffice(token, id, patch),
          },
        ),
      );
      resetOtp();
      setSignatureImage('');
      setCompleted({
        parcel,
        collectedBy: form.handoverTarget === 'second' ? 'Second receiver' : 'Main receiver',
      });
      notifySuccess('Parcel marked as Delivered by Office', 'Delivered');
      onFinished();
    } catch (error) {
      notifyError(
        'Delivery not confirmed',
        getMobileErrorMessage(error, '') || 'Failed to confirm delivery',
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [
    form,
    hasPickupQueue,
    isPickupOtpRequired,
    isPickupQueueEnabled,
    onFinished,
    otp,
    otpAuthorizationId,
    parcel,
    resetOtp,
    setSignatureImage,
    resources,
    withAuth,
  ]);

  const requestHomeDelivery = useCallback(async () => {
    if (!parcel || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await withAuth((token) => requestParcelHomeDelivery(token, parcel.id));
      notifySuccess('Parcel moved to Home Delivery Requested', 'Home delivery');
      close();
      onFinished();
    } catch (error) {
      notifyError(
        'Not moved',
        getMobileErrorMessage(error, '') || 'Failed to move parcel to home delivery',
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [close, onFinished, parcel, withAuth]);

  return {
    parcel,
    resources,
    loading,
    loadError,
    saving,
    completed,
    form,
    otp,
    phoneSlot,
    setPhoneSlot,
    hasPickupQueue,
    confirmBlocker,
    showOtpException,
    approval,
    open,
    close,
    retry: () => (parcel ? open(parcel) : undefined),
    confirm,
    requestHomeDelivery,
  };
}

export type OfficePickupHandover = ReturnType<typeof useOfficePickupHandover>;
