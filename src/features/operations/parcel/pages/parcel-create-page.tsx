import { ParcelCreateForm } from '../components/parcel-create-form';
import { ParcelSessionGuard } from '../components/parcel-session-guard';

export function ParcelCreatePage() {
  return (
    <div className="w-full p-4">
      <ParcelSessionGuard>
        <ParcelCreateForm />
      </ParcelSessionGuard>
    </div>
  );
}
