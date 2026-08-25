import { Clock3, QrCode, RefreshCw } from 'lucide-react';
import logoPng from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type SelfServiceSessionScreenProps = {
  state: 'loading' | 'expired' | 'error' | 'invalid';
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
};

const COPY = {
  expired: {
    title: 'Scan the QR code again',
    description: 'This 15-minute booking session has expired or has already been used.',
  },
  error: {
    title: 'Unable to start booking',
    description: 'We could not create a secure booking session right now.',
  },
  invalid: {
    title: 'Booking link is invalid',
    description: 'Please ask the branch for its current self-service QR code.',
  },
} as const;

export function SelfServiceSessionScreen({
  state,
  message,
  onRetry,
  isRetrying,
}: SelfServiceSessionScreenProps) {
  if (state === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#17151d] text-white">
        <Spinner className="size-6" />
      </div>
    );
  }

  const copy = COPY[state];
  const Icon = state === 'expired' ? Clock3 : QrCode;

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#17151d] p-6 text-white">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="grid size-14 place-items-center rounded-full bg-white">
          <img src={logoPng} alt="Vipex" className="size-11 object-contain" />
        </div>
        <div className="mt-8 grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]">
          <Icon className="size-6 text-[#ff7279]" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">{message ?? copy.description}</p>
        {onRetry ? (
          <Button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="mt-7 h-12 gap-2 rounded-xl bg-[#ef3340] px-5 text-white hover:bg-[#ff4652]"
          >
            {isRetrying ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />}
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
