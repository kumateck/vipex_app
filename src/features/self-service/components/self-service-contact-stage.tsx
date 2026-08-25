import type { Control } from 'react-hook-form';
import { SelfServiceContactFields } from './self-service-contact-fields';
import { SelfServiceStageShell } from './self-service-stage-shell';
import type { SelfServiceBookingFormValues } from '../types/self-service-form.types';

type SelfServiceContactStageProps = {
  control: Control<SelfServiceBookingFormValues>;
  branchId: string;
  sessionToken: string;
  role: 'sender' | 'receiver';
  onBack?: () => void;
  onNext: () => void;
};

const COPY = {
  sender: {
    title: 'Who is sending the parcel?',
    description: "We'll use this to prepare your booking.",
    phoneLabel: 'Sender Phone Number',
    fullnameLabel: "Sender's Name",
    fullnamePlaceholder: 'e.g. Kwame Mensah',
    phoneRequiredMessage: 'Sender phone number is required',
    newCustomerIntro: "We don't have this number yet. What's the sender's name?",
  },
  receiver: {
    title: 'Who is receiving the parcel?',
    description: 'Enter the phone number of the person picking this up.',
    phoneLabel: 'Receiver Phone Number',
    fullnameLabel: "Receiver's Name",
    fullnamePlaceholder: 'e.g. Ama Owusu',
    phoneRequiredMessage: 'Receiver phone number is required',
    newCustomerIntro: "We don't have this number yet. What's the receiver's name?",
  },
} as const;

export function SelfServiceContactStage({
  control,
  branchId,
  sessionToken,
  role,
  onBack,
  onNext,
}: SelfServiceContactStageProps) {
  const copy = COPY[role];

  return (
    <SelfServiceStageShell
      title={copy.title}
      description={copy.description}
      onBack={onBack}
      onNext={onNext}
    >
      <SelfServiceContactFields
        control={control}
        branchId={branchId}
        sessionToken={sessionToken}
        namePrefix={role}
        phoneLabel={copy.phoneLabel}
        fullnameLabel={copy.fullnameLabel}
        fullnamePlaceholder={copy.fullnamePlaceholder}
        phoneRequiredMessage={copy.phoneRequiredMessage}
        newCustomerIntro={copy.newCustomerIntro}
      />
    </SelfServiceStageShell>
  );
}
