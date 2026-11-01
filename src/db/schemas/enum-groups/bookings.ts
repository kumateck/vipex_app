export enum PendingBookingStatus {
  PENDING = 0,
  CONFIRMED = 1,
  CANCELLED = 2,
  EXPIRED = 3,
}

export enum SelfServiceDraftStatus {
  PENDING = 0, // submitted by customer, awaiting an agent
  CLAIMED = 1, // an agent opened it to complete (soft lock)
  COMPLETED = 2, // turned into a real booking/parcel
  CANCELLED = 3, // agent/system cancelled (spam, duplicate, invalid)
  EXPIRED = 4, // TTL passed, never completed
}
