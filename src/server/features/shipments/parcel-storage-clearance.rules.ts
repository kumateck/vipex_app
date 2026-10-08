export function getStorageClearanceDaysError(input: {
  requestedDays: number;
  accruedDays: number;
}) {
  if (
    !Number.isSafeInteger(input.requestedDays) ||
    input.requestedDays <= 0 ||
    input.requestedDays > 2147483647
  ) {
    return 'Days to clear must be a whole number greater than 0';
  }
  return null;
}

export function getStorageClearanceExecutionError(input: {
  requestedDays: number;
  accruedDays: number;
  clearAll: boolean;
  requestedAmountPsw: number;
  requestedRatePsw: number;
  currentRatePsw: number;
  outstandingPsw: number;
}) {
  if (input.accruedDays <= 0 || input.outstandingPsw <= 0)
    return 'There is no outstanding storage accrual to clear';
  if (
    input.clearAll &&
    (input.requestedDays !== input.accruedDays || input.requestedAmountPsw !== input.outstandingPsw)
  )
    return 'Clear All request is out of date; return it for requester review';
  if (input.requestedRatePsw !== input.currentRatePsw)
    return 'Storage fee rate changed; return the request for requester review';
  if (input.requestedAmountPsw > input.outstandingPsw)
    return 'Requested days exceed outstanding storage; return the request for requester review';
  return null;
}
