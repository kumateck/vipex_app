import type { ParcelFullDetails, ParcelHistoryEvent, ParcelSearchRow } from '@mobile/types/parcels';
import { ParcelChargesCard } from '../parcel-charges-card';
import { ParcelDeletedNotice } from '../parcel-deleted-notice';
import { ParcelDeliverySection } from '../parcel-delivery-section';
import type { ParcelDetailTab } from '../parcel-detail-tabs';
import { ParcelFinancialSections } from '../parcel-financial-sections';
import { ParcelHistorySections } from '../parcel-history-sections';
import { ParcelPeopleSection } from '../parcel-people-section';
import { ParcelSummarySections } from '../parcel-summary-sections';
import { ParcelTimelineSection } from '../parcel-timeline-section';

type ParcelTabContentProps = {
  tab: ParcelDetailTab;
  details: ParcelFullDetails;
  row: ParcelSearchRow | null;
  relatedRows: ParcelSearchRow[];
  branchNameById: Map<string, string>;
  history: { events: ParcelHistoryEvent[]; loading: boolean; error: string | null };
};

export function ParcelTabContent({
  tab,
  details,
  row,
  relatedRows,
  branchNameById,
  history,
}: ParcelTabContentProps) {
  switch (tab) {
    case 'people':
      return <ParcelPeopleSection details={details} row={row} />;
    case 'payments':
      return (
        <>
          <ParcelChargesCard details={details} />
          <ParcelFinancialSections details={details} />
        </>
      );
    case 'delivery':
      return <ParcelDeliverySection details={details} />;
    case 'history':
      return (
        <>
          <ParcelTimelineSection
            events={history.events}
            loading={history.loading}
            error={history.error}
          />
          <ParcelHistorySections
            details={details}
            relatedRows={relatedRows}
            branchNameById={branchNameById}
          />
        </>
      );
    default:
      return (
        <>
          <ParcelDeletedNotice details={details} />
          <ParcelSummarySections details={details} row={row} />
        </>
      );
  }
}
