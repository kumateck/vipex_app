import { mobileApiGet } from '@mobile/lib/api';

export type MobileChargeAgentOption = { id: string; fullname: string };
export type ChargeAgentSource = 'booking' | 'self-service';

export function listParcelChargeAgents(token: string, source: ChargeAgentSource) {
  return mobileApiGet<MobileChargeAgentOption[]>({
    path:
      source === 'self-service'
        ? '/self-service/charge-agent-options'
        : '/shipments/bookings/charge-agent-options',
    token,
  });
}
