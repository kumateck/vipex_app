import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { normalizePhoneDigits } from '@/lib/phone';
import { sanitizeNumber, sanitizeString } from '@/lib/utils';
import { SELF_SERVICE_TERMS_VERSION } from '@/shared/self-service/terms';
import { useSubmitSelfServiceDraftMutation } from '../api/self-service-public.api';
import {
  createInitialSelfServiceFormValues,
  SELF_SERVICE_STAGE_FIELDS,
  SELF_SERVICE_STAGES,
  type SelfServiceBookingFormValues,
  type SelfServiceStage,
} from '../types/self-service-form.types';

function getErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('data' in error)) return null;
  const data = (error as { data?: { error?: { message?: string } } }).data;
  return data?.error?.message ?? null;
}

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('status' in error)) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

export function useSelfServiceGuidedFlow(
  branchId: string,
  sessionToken: string,
  onSessionConsumed: () => void,
  onSessionExpired: () => void,
) {
  const [stageIndex, setStageIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submittedDraftId, setSubmittedDraftId] = useState<string | null>(null);
  const [submitDraft, { isLoading: isSubmitting }] = useSubmitSelfServiceDraftMutation();

  const form = useForm<SelfServiceBookingFormValues>({
    defaultValues: createInitialSelfServiceFormValues(),
    mode: 'onSubmit',
  });

  const stage = SELF_SERVICE_STAGES[stageIndex] ?? 'sender';

  const submit = async () => {
    const values = form.getValues();
    try {
      const parcelValueCedis = sanitizeNumber(sanitizeString(values.parcelValue).replace(/,/g, ''));
      const response = await submitDraft({
        sessionToken,
        branchId,
        sender: {
          fullname: values.sender.fullname.trim(),
          phone: normalizePhoneDigits(values.sender.phone),
          phone2: values.sender.phone2 ? normalizePhoneDigits(values.sender.phone2) : null,
          customerId: values.sender.customerId || null,
        },
        receiver: {
          fullname: values.receiver.fullname.trim(),
          phone: normalizePhoneDigits(values.receiver.phone),
          phone2: values.receiver.phone2 ? normalizePhoneDigits(values.receiver.phone2) : null,
          customerId: values.receiver.customerId || null,
        },
        destinationBranchId: values.destinationBranchId,
        destinationLocationId: values.destinationLocationId || null,
        parcelContent: values.parcelContent.trim(),
        parcelValueCedis,
        callSender: values.callSender,
        termsAccepted: true,
        termsVersion: SELF_SERVICE_TERMS_VERSION,
      }).unwrap();
      onSessionConsumed();
      setSubmittedDraftId(response.draftId);
    } catch (error) {
      if (getErrorStatus(error) === 410) {
        onSessionExpired();
        return;
      }
      // Data entered so far is preserved - the form is untouched on failure,
      // so the customer can just retry without retyping anything.
      toast.error(getErrorMessage(error) ?? 'Failed to submit your booking. Please try again.');
    }
  };

  const goNext = async () => {
    const fields = SELF_SERVICE_STAGE_FIELDS[stage];
    const isValid = fields.length ? await form.trigger(fields) : true;
    if (!isValid) return;

    if (stage === 'review') {
      await submit();
      return;
    }
    setDirection(1);
    setStageIndex((index) => Math.min(index + 1, SELF_SERVICE_STAGES.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStageIndex((index) => Math.max(index - 1, 0));
  };

  const goToStage = (target: SelfServiceStage) => {
    const targetIndex = SELF_SERVICE_STAGES.indexOf(target);
    if (targetIndex >= 0 && targetIndex <= stageIndex) {
      setDirection(targetIndex < stageIndex ? -1 : 1);
      setStageIndex(targetIndex);
    }
  };

  return {
    form,
    stage,
    stageIndex,
    direction,
    goNext,
    goBack,
    goToStage,
    isSubmitting,
    submittedDraftId,
  };
}
