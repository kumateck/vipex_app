import { ParcelPickupQueueBoardPage } from '@/features/operations/parcel';

export default function SenderPickupQueueBoardRoute() {
  return (
    <ParcelPickupQueueBoardPage
      paymentBucket="SP"
      title="Sender Paid Queue Board"
      description="Live queue cards for sender-paid parcel pickups."
    />
  );
}
