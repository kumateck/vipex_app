export const sigWebCapturePage = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; connect-src https://tablet.sigwebtablet.com:47290 http://tablet.sigwebtablet.com:47289 https://localhost:47290 http://localhost:47289 https://127.0.0.1:47290 http://127.0.0.1:47289">
<title>Customer signature</title>
<style>
body { font: 16px system-ui; color: #172033; padding: 20px; }
canvas { width: 100%; border: 1px solid #a4acbb; border-radius: 4px; }
footer { margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px; }
button { font: inherit; padding: 8px 14px; }
</style>
<h1>Customer signature</h1>
<p id="status" aria-live="polite">Connecting to the Topaz pad…</p>
<canvas width="460" height="145" aria-label="Signature preview"></canvas>
<footer>
  <button id="cancel">Cancel</button>
  <button id="clear" disabled>Clear</button>
  <button id="done" disabled>Save signature</button>
</footer>
</html>`;

type SigWeb = {
  GetSigWebVersion(): string;
  ClearTablet(): void;
  SetTabletState(state: 1, ctx: CanvasRenderingContext2D, delay: number): number;
  SetTabletState(state: 0, timer: number): void;
  NumberOfTabletPoints(): number;
  GetSigString(): string;
  GetSigImageB64(callback: (image: string) => void): void;
  SetImageXSize(size: number): void;
  SetImageYSize(size: number): void;
  SetSigCompressionMode(mode: number): void;
  SetEncryptionMode(mode: number): void;
  Reset(): void;
};

// Serialized into a dedicated, sandboxed window. Keep dependencies inside this function.
export function runSigWebCapture() {
  const sdk = window as unknown as SigWeb;
  const status = document.getElementById('status')!;
  const canvas = document.querySelector('canvas')!;
  const clear = document.querySelector<HTMLButtonElement>('#clear')!;
  const done = document.querySelector<HTMLButtonElement>('#done')!;
  const cancel = document.querySelector<HTMLButtonElement>('#cancel')!;
  let captureTimer: number;
  let imageTimeout: number | undefined;

  return new Promise<{ signatureImage: string; sigString: string } | null>((resolve, reject) => {
    const stop = () => {
      window.clearTimeout(imageTimeout);
      try {
        if (captureTimer !== undefined) sdk.SetTabletState(0, captureTimer);
        sdk.Reset();
      } catch {
        // The driver may already have disconnected.
      }
    };
    window.addEventListener('pagehide', stop, { once: true });
    cancel.onclick = () => {
      stop();
      resolve(null);
    };
    try {
      if (!sdk.GetSigWebVersion()) throw new Error('SigWeb service not detected');
      sdk.ClearTablet();
      sdk.SetImageXSize(canvas.width);
      sdk.SetImageYSize(canvas.height);
      sdk.SetSigCompressionMode(1);
      sdk.SetEncryptionMode(0);
      captureTimer = sdk.SetTabletState(1, canvas.getContext('2d')!, 75);
      status.textContent = 'Ask the customer to sign on the connected pad.';
      clear.disabled = done.disabled = false;
      clear.onclick = () => {
        try {
          sdk.ClearTablet();
          status.textContent = 'Ask the customer to sign again.';
        } catch (error) {
          stop();
          reject(error);
        }
      };
      done.onclick = () => {
        try {
          if (sdk.NumberOfTabletPoints() < 3) {
            status.textContent =
              'No usable signature yet. Check the pad connection and sign again.';
            return;
          }
          done.disabled = clear.disabled = true;
          const sigString = sdk.GetSigString();
          imageTimeout = window.setTimeout(() => {
            stop();
            reject(new Error('Timed out reading the Topaz signature'));
          }, 5_000);
          sdk.GetSigImageB64((image) => {
            const signatureImage = 'data:image/png;base64,' + image.trim();
            const preview = new Image();
            preview.onerror = () => {
              stop();
              reject(new Error('The Topaz driver returned an unreadable signature'));
            };
            preview.onload = () => {
              if (preview.naturalWidth > 1024 || preview.naturalHeight > 512) {
                stop();
                reject(new Error('The Topaz signature image is too large'));
                return;
              }
              const scratch = document.createElement('canvas');
              scratch.width = preview.naturalWidth;
              scratch.height = preview.naturalHeight;
              const ctx = scratch.getContext('2d')!;
              ctx.drawImage(preview, 0, 0);
              const pixels = ctx.getImageData(0, 0, scratch.width, scratch.height).data;
              let ink = 0;
              for (let i = 0; i < pixels.length; i += 4) {
                if (
                  pixels[i + 3]! > 128 &&
                  Math.min(pixels[i]!, pixels[i + 1]!, pixels[i + 2]!) < 210
                )
                  ink++;
              }
              if (ink < 3) {
                window.clearTimeout(imageTimeout);
                status.textContent = 'The signature is blank. Clear the pad and try again.';
                done.disabled = clear.disabled = false;
                return;
              }
              stop();
              resolve({ signatureImage, sigString });
            };
            preview.src = signatureImage;
          });
        } catch (error) {
          stop();
          reject(error);
        }
      };
    } catch (error) {
      stop();
      reject(error);
    }
  });
}
