import { mobileApiGet } from '@mobile/lib/api';
export type ReceivingStaffOption = { id: string; fullname: string; employeeNumber: string };
export function listReceivingStaff(
  token: string,
  destinationId: string,
  source: 'booking' | 'self-service',
) {
  return mobileApiGet<ReceivingStaffOption[]>({
    path:
      source === 'self-service'
        ? '/self-service/receiving-staff-options'
        : '/shipments/bookings/receiving-staff-options',
    token,
    query: { destinationId },
  });
}
