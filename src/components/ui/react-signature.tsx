import { cn } from '@/lib/utils';
import { ReactMinimalSignature } from 'react-minimal-signature';
import 'react-minimal-signature/rmc.css';

type ReactSignatureProps = {
  className?: string;
  onChange: (dataUrl: string | undefined) => void;
};

export function ReactSignature({ className, onChange }: ReactSignatureProps) {
  return (
    <div className="relative">
      <ReactMinimalSignature
        withGuide={false}
        onDrawEnd={(details) => {
          details.getDataUrl('image/png').then((url) => {
            onChange(url);
          });
        }}
        classNames={{
          control: cn('!bg-card h-48 !rounded-xl !border !border-input !border-solid', className),
        }}
      />
    </div>
  );
}
