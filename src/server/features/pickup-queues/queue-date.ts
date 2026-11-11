/** Ghana's operational day starts at midnight UTC. */
export function getPickupQueueDate(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
