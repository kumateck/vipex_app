import { lazy, memo, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useSendReceiptAction } from '../../hooks';

const SendReceiptDialog = lazy(() =>
  import('../../dialogs').then((module) => ({ default: module.SendReceiptDialog })),
);

export const SendReceiptAction = memo(function SendReceiptAction({
  parcelId,
  bookingCode,
  isDeleted,
}: {
  parcelId: string;
  bookingCode: string;
  isDeleted: boolean;
}) {
  const action = useSendReceiptAction(isDeleted);
  if (!action.isVisible) return null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={action.open}>
        Send receipt
      </Button>
      {action.isOpen ? (
        <Suspense fallback={null}>
          <SendReceiptDialog parcelId={parcelId} bookingCode={bookingCode} onClose={action.close} />
        </Suspense>
      ) : null}
    </>
  );
});
