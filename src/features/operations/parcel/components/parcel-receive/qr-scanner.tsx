import { useEffect, useRef, useState } from 'react';

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

export function isBarcodeDetectorAvailable() {
  const maybe = globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor };
  return typeof maybe.BarcodeDetector === 'function';
}

export function QrScanner({
  enabled,
  onDetected,
}: {
  enabled: boolean;
  onDetected: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onDetectedRef = useRef(onDetected);
  const lastDetectedRef = useRef<{ value: string; at: number } | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let isActive = true;
    let stream: MediaStream | null = null;
    let timeoutId: number | null = null;

    const maybe = globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor };
    const Detector = maybe.BarcodeDetector;

    if (!enabled) return;
    if (!Detector) {
      setScannerError('QR scanner is not supported on this browser. Use manual search below.');
      return;
    }

    const detector = new Detector({ formats: ['qr_code'] });

    const loop = async () => {
      if (!isActive) return;

      try {
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const barcodes = await detector.detect(video);
          const value = barcodes
            .find((barcode) => typeof barcode.rawValue === 'string')
            ?.rawValue?.trim();

          if (value) {
            const now = Date.now();
            const last = lastDetectedRef.current;
            const isDuplicate = last && last.value === value && now - last.at < 2000;
            if (!isDuplicate) {
              lastDetectedRef.current = { value, at: now };
              onDetectedRef.current(value);
            }
          }
        }
      } catch {
        // Ignore detection frame errors and keep scanning.
      }

      timeoutId = window.setTimeout(loop, 250);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (!isActive) return;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        setScannerError(null);
        void loop();
      } catch {
        setScannerError('Unable to access camera. Check permissions or use manual search.');
      }
    })();

    return () => {
      isActive = false;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
    };
  }, [enabled]);

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-md border bg-black">
        <video ref={videoRef} className="h-[260px] w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-primary/60" />
      </div>
      {scannerError ? <p className="text-sm text-destructive">{scannerError}</p> : null}
    </div>
  );
}
