import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { ParcelCreateForm } from '../parcel-create-form';

export function ParcelCreateOtherPage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <ParcelCreateForm nonIndividualSender />
      </div>
    </ScrollableWrapper>
  );
}
