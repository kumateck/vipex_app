type ActorId = string | null | undefined;

type ParcelDetailsActorSource = {
  parcel: {
    createdBy: ActorId;
    processedBy: ActorId;
    receivedBy: ActorId;
    confirmedBy: ActorId;
    deletedBy: ActorId;
    shelfPickerStaffId: ActorId;
  };
  payments: Array<{ cashierUserId: ActorId; voidedBy: ActorId }>;
  delivery: null | {
    createdBy: ActorId;
    frontDeskUserId: ActorId;
    deliveryUserId: ActorId;
    riderUserId: ActorId;
    receiverCalledConfirmedBy: ActorId;
    confirmedBy: ActorId;
  };
  pickupQueue: null | { queuedBy: ActorId; endedBy: ActorId; pickerStaffId: ActorId };
};

/** Every distinct user id referenced by a parcel's details, for one name lookup. */
export function collectParcelDetailsUserIds(source: ParcelDetailsActorSource): string[] {
  const { parcel, payments, delivery, pickupQueue } = source;
  const ids: ActorId[] = [
    parcel.createdBy,
    parcel.processedBy,
    parcel.receivedBy,
    parcel.confirmedBy,
    parcel.deletedBy,
    parcel.shelfPickerStaffId,
    ...payments.flatMap((payment) => [payment.cashierUserId, payment.voidedBy]),
    delivery?.createdBy,
    delivery?.frontDeskUserId,
    delivery?.deliveryUserId,
    delivery?.riderUserId,
    delivery?.receiverCalledConfirmedBy,
    delivery?.confirmedBy,
    pickupQueue?.queuedBy,
    pickupQueue?.endedBy,
    pickupQueue?.pickerStaffId,
  ];
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}
