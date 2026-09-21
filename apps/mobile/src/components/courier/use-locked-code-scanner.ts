import { useRef } from 'react';
import { useCodeScanner } from 'react-native-vision-camera';

const SAME_CODE_COOLDOWN_MS = 3000;

type HandledScan = {
  code: string;
  completedAt: number;
};

export function useLockedCodeScanner(onCodeScanned: (code: string) => void | Promise<void>) {
  const inFlightRef = useRef(false);
  const visibleCodeRef = useRef<string | null>(null);
  const lastHandledRef = useRef<HandledScan | null>(null);

  return useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned(codes) {
      const value = codes[0]?.value?.trim();
      if (!value) {
        visibleCodeRef.current = null;
        return;
      }

      const lastHandled = lastHandledRef.current;
      const sameCodeCoolingDown =
        lastHandled?.code === value && Date.now() - lastHandled.completedAt < SAME_CODE_COOLDOWN_MS;

      if (inFlightRef.current || visibleCodeRef.current === value || sameCodeCoolingDown) return;

      inFlightRef.current = true;
      visibleCodeRef.current = value;

      void Promise.resolve()
        .then(() => onCodeScanned(value))
        .catch(() => undefined)
        .finally(() => {
          lastHandledRef.current = { code: value, completedAt: Date.now() };
          inFlightRef.current = false;
          visibleCodeRef.current = null;
        });
    },
  });
}
