import { useRef, type PointerEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  encodeHandoverSignature,
  type SignaturePoint,
} from '@/shared/shipments/handover-signature';

const WIDTH = 480;
const HEIGHT = 160;

export function PickupCollectorSignature({
  onChange,
  disabled,
}: {
  onChange: (signature: string) => void;
  disabled: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<SignaturePoint[][]>([]);
  const activePointer = useRef<number | null>(null);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(Math.max(0, Math.min(WIDTH, ((event.clientX - box.left) / box.width) * WIDTH))),
      y: Math.round(
        Math.max(0, Math.min(HEIGHT, ((event.clientY - box.top) / box.height) * HEIGHT)),
      ),
    };
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled || activePointer.current !== null || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointer.current = event.pointerId;
    strokes.current.push([point(event)]);
    onChange('');
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (activePointer.current !== event.pointerId) return;
    const stroke = strokes.current.at(-1);
    const previous = stroke?.at(-1);
    if (!stroke || !previous) return;
    const next = point(event);
    if (next.x === previous.x && next.y === previous.y) return;
    stroke.push(next);
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    context.strokeStyle = '#111827';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(next.x, next.y);
    context.stroke();
  }

  function finish(event: PointerEvent<HTMLCanvasElement>) {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    onChange(encodeHandoverSignature(strokes.current, WIDTH, HEIGHT));
  }

  function clear() {
    canvas.current?.getContext('2d')?.clearRect(0, 0, WIDTH, HEIGHT);
    strokes.current = [];
    activePointer.current = null;
    onChange('');
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvas}
        width={WIDTH}
        height={HEIGHT}
        aria-label="Collector signature pad"
        className="block w-full touch-none rounded-md border bg-white"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
      />
      <Button type="button" variant="outline" disabled={disabled} onClick={clear}>
        Clear signature
      </Button>
    </div>
  );
}
