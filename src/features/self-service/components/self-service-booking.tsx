import logoPng from '@/assets/logo.png';
import { useSelfServiceBookingSession } from '../hooks';
import { SelfServiceBookingForm } from './self-service-booking-form';
import { SelfServiceSessionScreen } from './self-service-session-screen';

export function SelfServiceBooking({
  branchId,
  isScanEntry,
}: {
  branchId: string;
  isScanEntry: boolean;
}) {
  const booking = useSelfServiceBookingSession(branchId, isScanEntry);
  const { branch, sessionToken } = booking;
  if (booking.screen || !branch) {
    const recoverable = booking.screen === 'expired' || booking.screen === 'error';
    return (
      <SelfServiceSessionScreen
        state={booking.screen ?? 'invalid'}
        message={booking.errorMessage}
        onRetry={recoverable ? booking.retry : undefined}
        isRetrying={booking.isLoading}
      />
    );
  }

  return (
    <div
      data-self-service-scroll-container
      className="relative h-svh w-full max-w-full touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none bg-[#17151d] text-white [color-scheme:dark]"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[#b91c2d]/25 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-36 -right-24 h-80 w-80 rounded-full bg-[#253b91]/20 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.025),transparent_30%)]" />
      </div>

      <div className="relative mx-auto flex min-h-full w-[calc(100%-2rem)] min-w-0 max-w-4xl flex-col overflow-x-hidden sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
        <header className="sticky top-0 z-30 flex min-h-16 min-w-0 items-center justify-between gap-2 border-b border-white/8 bg-[#17151d]/80 py-3 backdrop-blur-xl sm:gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-lg shadow-black/15">
              <img src={logoPng} alt="Vipex" className="size-8 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-white">VIP Parcel</p>
              <p className="truncate text-xs text-white/50">Self-service booking</p>
            </div>
          </div>
          <div className="min-w-0 max-w-[38%] shrink rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-right text-xs font-medium text-white/70 shadow-sm min-[390px]:max-w-[45%] min-[390px]:px-3">
            <span className="block truncate">{branch.branchName}</span>
          </div>
        </header>

        <SelfServiceBookingForm
          key={sessionToken}
          onNewBooking={booking.continueBooking}
          branchId={branch.branchId}
          branchName={branch.branchName}
          sessionToken={sessionToken}
          onSessionConsumed={booking.markCompleted}
          onSessionExpired={booking.markExpired}
        />
      </div>
    </div>
  );
}
