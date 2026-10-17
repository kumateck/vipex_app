import { useGetWhatsAppAvailabilityQuery } from '../services';

/** Whether staff may pick WhatsApp as a delivery channel right now. */
export function useWhatsAppAvailability() {
  const { data, isLoading } = useGetWhatsAppAvailabilityQuery();
  return { isWhatsAppAvailable: Boolean(data?.available), isLoading };
}
