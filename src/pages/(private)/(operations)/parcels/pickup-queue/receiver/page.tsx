import { ParcelPickupQueueBoardPage } from '@/features/operations/parcel';

export default function ReceiverPickupQueueBoardRoute() {
  return (
    <ParcelPickupQueueBoardPage
      paymentBucket="TP"
      title="Receiver Pays Queue Board"
      description="Live queue cards for receiver-pay parcel pickups."
    />
  );
}
