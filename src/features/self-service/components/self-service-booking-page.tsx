import { useParams, useSearchParams } from 'react-router-dom';
import { SelfServiceBooking } from './self-service-booking';

export function SelfServiceBookingPage() {
  const { branchId = '' } = useParams<{ branchId: string }>();
  const [searchParams] = useSearchParams();
  return (
    <SelfServiceBooking
      key={branchId}
      branchId={branchId}
      isScanEntry={searchParams.get('scan') === '1'}
    />
  );
}
