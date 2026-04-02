import { ParcelCreateForm } from '../components/parcel-create-form';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function ParcelCreatePage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <ParcelCreateForm />
      </div>
    </ScrollableWrapper>
  );
}
