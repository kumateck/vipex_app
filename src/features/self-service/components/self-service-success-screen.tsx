import { Check, QrCode } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

type SelfServiceSuccessScreenProps = {
  branchName: string;
};

export function SelfServiceSuccessScreen({ branchName }: SelfServiceSuccessScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[calc(100svh-4rem)] flex-1 items-center justify-center py-10"
    >
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <motion.div
          initial={prefersReducedMotion ? false : { scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 220, damping: 16, delay: 0.08 }
          }
          className="grid size-20 place-items-center rounded-full border border-emerald-300/25 bg-emerald-300/12 shadow-[0_0_50px_rgba(110,231,183,0.16)]"
        >
          <Check className="size-10 text-emerald-300" strokeWidth={2.5} />
        </motion.div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/75">
          Booking received
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
          You&apos;re all set.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-6 text-white/50 sm:text-base">
          A staff member at {branchName} will review the parcel, confirm the price, and contact you
          to complete the booking.
        </p>
        <div className="mt-8 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/65">
          <QrCode className="size-4 shrink-0 text-[#ff7279]" />
          Scan the branch QR code again to book another parcel.
        </div>
      </div>
    </motion.div>
  );
}
