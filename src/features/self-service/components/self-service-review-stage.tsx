import type { ReactNode } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sanitizeString } from '@/lib/utils';
import {
  useListSelfServiceDestinationBranchesQuery,
  useListSelfServiceDestinationLocationsQuery,
} from '../api/self-service-public.api';
import { SelfServiceStageShell } from './self-service-stage-shell';
import type {
  SelfServiceBookingFormValues,
  SelfServiceStage,
} from '../types/self-service-form.types';
import { SelfServiceTermsConsent } from './self-service-terms';

type SelfServiceReviewStageProps = {
  control: Control<SelfServiceBookingFormValues>;
  branchId: string;
  sessionToken: string;
  onBack: () => void;
  onNext: () => void;
  onEdit: (stage: SelfServiceStage) => void;
  isSubmitting: boolean;
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-white/40">{label}</span>
      <span className="max-w-[68%] break-words text-right font-medium text-white/90">{value}</span>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 rounded-full px-3 text-xs text-[#ff8087] hover:bg-white/10 hover:text-[#ff9ca1]"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" /> Edit
        </Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function SelfServiceReviewStage({
  control,
  branchId,
  sessionToken,
  onBack,
  onNext,
  onEdit,
  isSubmitting,
}: SelfServiceReviewStageProps) {
  const values = useWatch({ control });
  const destinationBranchId = sanitizeString(values.destinationBranchId);
  const destinationLocationId = sanitizeString(values.destinationLocationId);

  const { data: branchOptions = [] } = useListSelfServiceDestinationBranchesQuery(
    { sourceBranchId: branchId, sessionToken },
    { skip: !branchId || !sessionToken },
  );
  const { data: locationOptions = [] } = useListSelfServiceDestinationLocationsQuery(
    { sourceBranchId: branchId, destinationBranchId, sessionToken },
    { skip: !branchId || !destinationBranchId || !sessionToken },
  );

  const destinationBranchName =
    branchOptions.find((branch) => branch.id === destinationBranchId)?.name ?? '—';
  const destinationLocationName =
    locationOptions.find((location) => location.id === destinationLocationId)?.name ?? '—';

  return (
    <SelfServiceStageShell
      title="Review your booking"
      description="Make sure everything looks right before you confirm."
      onBack={onBack}
      onNext={onNext}
      nextLabel="Confirm Parcel"
      isSubmitting={isSubmitting}
    >
      <div className="space-y-3.5">
        <ReviewSection title="Sender" onEdit={() => onEdit('sender')}>
          <ReviewRow label="Name" value={sanitizeString(values.sender?.fullname) || '—'} />
          <ReviewRow label="Phone" value={sanitizeString(values.sender?.phone) || '—'} />
          {sanitizeString(values.sender?.phone2) ? (
            <ReviewRow label="Backup phone" value={sanitizeString(values.sender?.phone2)} />
          ) : null}
        </ReviewSection>

        <ReviewSection title="Receiver" onEdit={() => onEdit('receiver')}>
          <ReviewRow label="Name" value={sanitizeString(values.receiver?.fullname) || '—'} />
          <ReviewRow label="Phone" value={sanitizeString(values.receiver?.phone) || '—'} />
          {sanitizeString(values.receiver?.phone2) ? (
            <ReviewRow label="Backup phone" value={sanitizeString(values.receiver?.phone2)} />
          ) : null}
        </ReviewSection>

        <ReviewSection title="Destination" onEdit={() => onEdit('destination')}>
          <ReviewRow label="Branch" value={destinationBranchName} />
          <ReviewRow label="Location" value={destinationLocationName} />
        </ReviewSection>

        <ReviewSection title="Parcel" onEdit={() => onEdit('parcel')}>
          <ReviewRow label="Contents" value={sanitizeString(values.parcelContent) || '—'} />
          <ReviewRow label="Value" value={`GH₵${sanitizeString(values.parcelValue) || '0'}`} />
          <ReviewRow label="Call before delivery" value={values.callSender ? 'Yes' : 'No'} />
        </ReviewSection>

        <SelfServiceTermsConsent control={control} />
      </div>
    </SelfServiceStageShell>
  );
}
