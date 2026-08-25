import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Form } from '@/components/ui/form';
import { useSelfServiceGuidedFlow } from '../hooks/use-self-service-guided-flow';
import { SelfServiceContactStage } from './self-service-contact-stage';
import { SelfServiceDestinationStage } from './self-service-destination-stage';
import { SelfServiceParcelStage } from './self-service-parcel-stage';
import { SelfServiceProgress } from './self-service-progress';
import { SelfServiceReviewStage } from './self-service-review-stage';
import { SelfServiceSuccessScreen } from './self-service-success-screen';

type SelfServiceBookingFormProps = {
  branchId: string;
  branchName: string;
  sessionToken: string;
  onSessionConsumed: () => void;
  onSessionExpired: () => void;
};

const STAGE_TRANSITION = { duration: 0.32, ease: [0.22, 1, 0.36, 1] } as const;

const stageVariants = {
  enter: (direction: 1 | -1) => ({ opacity: 0, y: direction > 0 ? 34 : -34 }),
  center: { opacity: 1, y: 0 },
  exit: (direction: 1 | -1) => ({ opacity: 0, y: direction > 0 ? -26 : 26 }),
};

export function SelfServiceBookingForm({
  branchId,
  branchName,
  sessionToken,
  onSessionConsumed,
  onSessionExpired,
}: SelfServiceBookingFormProps) {
  const prefersReducedMotion = useReducedMotion();
  const flowRootRef = useRef<HTMLDivElement>(null);
  const { form, stage, direction, goNext, goBack, goToStage, isSubmitting, submittedDraftId } =
    useSelfServiceGuidedFlow(branchId, sessionToken, onSessionConsumed, onSessionExpired);

  useEffect(() => {
    const scrollContainer = flowRootRef.current?.closest<HTMLElement>(
      '[data-self-service-scroll-container]',
    );
    scrollContainer?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [stage]);

  if (submittedDraftId) {
    return <SelfServiceSuccessScreen branchName={branchName} />;
  }

  return (
    <Form {...form}>
      <div ref={flowRootRef} className="flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden">
        <SelfServiceProgress stage={stage} />
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={stage}
            custom={direction}
            variants={prefersReducedMotion ? undefined : stageVariants}
            initial={prefersReducedMotion ? false : 'enter'}
            animate="center"
            exit={prefersReducedMotion ? undefined : 'exit'}
            transition={prefersReducedMotion ? { duration: 0 } : STAGE_TRANSITION}
            className="flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden"
          >
            {stage === 'sender' ? (
              <SelfServiceContactStage
                control={form.control}
                branchId={branchId}
                sessionToken={sessionToken}
                role="sender"
                onNext={goNext}
              />
            ) : null}
            {stage === 'receiver' ? (
              <SelfServiceContactStage
                control={form.control}
                branchId={branchId}
                sessionToken={sessionToken}
                role="receiver"
                onBack={goBack}
                onNext={goNext}
              />
            ) : null}
            {stage === 'destination' ? (
              <SelfServiceDestinationStage
                control={form.control}
                branchId={branchId}
                sessionToken={sessionToken}
                onBack={goBack}
                onNext={goNext}
              />
            ) : null}
            {stage === 'parcel' ? (
              <SelfServiceParcelStage control={form.control} onBack={goBack} onNext={goNext} />
            ) : null}
            {stage === 'review' ? (
              <SelfServiceReviewStage
                control={form.control}
                branchId={branchId}
                sessionToken={sessionToken}
                onBack={goBack}
                onNext={goNext}
                onEdit={goToStage}
                isSubmitting={isSubmitting}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </Form>
  );
}
