import { useCallback, useEffect, useRef, useState } from 'react';

function playSuccessBeep() {
  const AudioCtx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    // Ignore audio playback errors.
  }
}

export function useScanSuccessFeedback() {
  const [scanSuccessFlash, setScanSuccessFlash] = useState(false);
  const flashTimeoutRef = useRef<number | null>(null);

  const triggerScanSuccessFeedback = useCallback(() => {
    playSuccessBeep();
    setScanSuccessFlash(true);
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = window.setTimeout(() => {
      setScanSuccessFlash(false);
    }, 700);
  }, []);

  useEffect(
    () => () => {
      if (flashTimeoutRef.current !== null) window.clearTimeout(flashTimeoutRef.current);
    },
    [],
  );

  return { scanSuccessFlash, triggerScanSuccessFeedback };
}
