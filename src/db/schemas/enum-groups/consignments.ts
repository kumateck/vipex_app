export enum ConsignmentStatus {
  PREPARING = 0,
  READY = 1,
  IN_TRANSIT = 2,
  DELIVERED = 3,
  CANCELLED = 4,
  DELAYED = 5,
}

export enum AutoGroupingMode {
  BY_DESTINATION = 0,
  BY_WEIGHT = 1,
  BY_VALUE = 2,
  BY_SCHEDULE = 3,
  NONE = 4,
}

export enum ConsignmentReceivingStatus {
  OPEN = 0, // created, receiving in progress or not yet started
  CLOSED = 1, // closed, all active items confirmed arrived
  CLOSED_WITH_EXCEPTIONS = 2, // closed with sign-off despite missing items
}

export enum DeliveryFeeBasis {
  DISTANCE = 0,
  WEIGHT = 1,
  VALUE = 2,
  FIXED = 3,
}
