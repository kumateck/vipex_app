import { motion, useReducedMotion } from 'framer-motion';
import {
  SELF_SERVICE_STAGES,
  SELF_SERVICE_STAGE_LABELS,
  type SelfServiceStage,
} from '../types/self-service-form.types';

export function SelfServiceProgress({ stage }: { stage: SelfServiceStage }) {
  const currentIndex = SELF_SERVICE_STAGES.indexOf(stage);
  const prefersReducedMotion = useReducedMotion();
  const progress = ((currentIndex + 1) / SELF_SERVICE_STAGES.length) * 100;

  return (
    <div
      role="progressbar"
      aria-label="Booking progress"
      aria-valuemin={1}
      aria-valuemax={SELF_SERVICE_STAGES.length}
      aria-valuenow={currentIndex + 1}
      className="min-w-0 max-w-full space-y-2 overflow-x-hidden pt-4"
    >
      <div className="flex items-center justify-between gap-3 text-xs font-medium">
        <span className="text-white/75">{SELF_SERVICE_STAGE_LABELS[stage]}</span>
        <span className="tabular-nums text-white/40">
          {currentIndex + 1} / {SELF_SERVICE_STAGES.length}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#ef3340] to-[#ff6b6b] shadow-[0_0_16px_rgba(239,51,64,0.45)]"
        />
      </div>
    </div>
  );
}
