import type { Control } from 'react-hook-form';
import { SelfServiceParcelFields } from './self-service-parcel-fields';
import { SelfServiceStageShell } from './self-service-stage-shell';
import type { SelfServiceBookingFormValues } from '../types/self-service-form.types';

type SelfServiceParcelStageProps = {
  control: Control<SelfServiceBookingFormValues>;
  onBack?: () => void;
  onNext: () => void;
};

export function SelfServiceParcelStage({ control, onBack, onNext }: SelfServiceParcelStageProps) {
  return (
    <SelfServiceStageShell
      title="What are you sending?"
      description="Tell us what's inside and its value."
      onBack={onBack}
      onNext={onNext}
      nextLabel="Review"
    >
      <SelfServiceParcelFields control={control} />
    </SelfServiceStageShell>
  );
}
