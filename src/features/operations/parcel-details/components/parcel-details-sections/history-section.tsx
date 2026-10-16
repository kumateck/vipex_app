import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { ParcelHistoryCategory, ParcelHistoryEvent } from '../../types';
import { formatWhen, groupHistoryByDay } from '../../utils/parcel-details-format';
import { DetailCard, EmptyNote } from '../detail-grid/detail-grid';

const CATEGORY_LABELS: Record<ParcelHistoryCategory, string> = {
  created: 'Booking',
  status: 'Status',
  custody: 'Custody',
  payment: 'Payment',
  delivery: 'Delivery',
  storage: 'Storage',
  exception: 'Exception',
  communication: 'Customer contact',
  edit: 'Change',
  print: 'Print',
};

type HistorySectionProps = {
  events: ParcelHistoryEvent[];
  isLoading: boolean;
  isError: boolean;
};

export const HistorySection = memo(function HistorySection({
  events,
  isLoading,
  isError,
}: HistorySectionProps) {
  const days = useMemo(() => groupHistoryByDay(events), [events]);

  return (
    <DetailCard title={`History (${events.length})`}>
      {isLoading ? <EmptyNote>Loading history...</EmptyNote> : null}
      {isError ? (
        <EmptyNote>History could not be loaded. Close and reopen to try again.</EmptyNote>
      ) : null}
      {!isLoading && !isError && events.length === 0 ? (
        <EmptyNote>No recorded history.</EmptyNote>
      ) : null}
      <div className="space-y-6">
        {days.map(({ day, items }) => (
          <section key={day}>
            <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{day}</h3>
            <ol className="relative space-y-3 border-l pl-5">
              {items.toReversed().map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{event.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {CATEGORY_LABELS[event.category] ?? event.category}
                    </Badge>
                  </div>
                  {event.description ? (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatWhen(event.occurredAt)}
                    {event.actorName ? ` · by ${event.actorName}` : ''}
                    {event.branchName ? ` · ${event.branchName}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </DetailCard>
  );
});
