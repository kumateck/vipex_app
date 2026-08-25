import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type SelfServiceStageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  isSubmitting?: boolean;
};

export function SelfServiceStageShell({
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
  isSubmitting,
}: SelfServiceStageShellProps) {
  return (
    <section className="flex min-h-[calc(100svh-8.5rem)] min-w-0 max-w-full flex-col overflow-x-hidden">
      <div className="mx-auto flex w-full min-w-0 max-w-xl flex-1 flex-col justify-center py-8 sm:py-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff7279]">
            <span className="h-px w-6 bg-[#ef3340]" />
            Your booking
          </div>
          <h2 className="max-w-full break-words text-balance text-2xl font-semibold leading-tight tracking-[-0.025em] text-white sm:max-w-lg sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-lg text-sm leading-6 text-white/50 sm:text-base">{description}</p>
          ) : null}
        </div>

        <div className="mt-7 min-w-0 max-w-full">{children}</div>
      </div>

      <div className="sticky bottom-0 z-20 flex min-w-0 max-w-full items-center gap-3 border-t border-white/8 bg-[#17151d]/88 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:pb-6 sm:pt-3 sm:backdrop-blur-none">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            aria-label="Back"
            onClick={onBack}
            disabled={isSubmitting}
            className="h-12 shrink-0 gap-2 rounded-xl border-white/15 bg-white/[0.05] px-4 text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden min-[360px]:inline">Back</span>
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="h-12 flex-1 gap-2 rounded-xl bg-[#ef3340] px-5 text-base font-semibold text-white shadow-lg shadow-[#ef3340]/20 transition-[transform,background-color,box-shadow] hover:bg-[#ff4652] hover:text-white active:scale-[0.985]"
        >
          {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
          {isSubmitting ? 'Submitting...' : nextLabel}
          {!isSubmitting ? <ArrowRight className="size-4" /> : null}
        </Button>
      </div>
    </section>
  );
}
