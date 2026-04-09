import { List, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { TabsContent } from '@/components/ui/tabs';
import type { CommunicationEventItem } from '../types/communication-events.types';
import { toDateOnly } from '../utils/communication-events-date';
import { CommunicationEventCard } from './communication-event-card';

type CommunicationEventsListTabProps = {
  search: string;
  setSearch: (value: string) => void;
  typeFilter: 'all' | 'meeting' | 'audio' | 'video';
  setTypeFilter: (value: 'all' | 'meeting' | 'audio' | 'video') => void;
  statusFilter: 'all' | 'scheduled' | 'completed';
  setStatusFilter: (value: 'all' | 'scheduled' | 'completed') => void;
  fromDate: string;
  setFromDate: (value: string) => void;
  toDate: string;
  setToDate: (value: string) => void;
  isLoading: boolean;
  filteredEvents: CommunicationEventItem[];
  groupedListEvents: Record<'today' | 'upcoming' | 'previous', CommunicationEventItem[]>;
  userById: Map<string, { id: string; fullname?: string | null; email?: string | null }>;
  onEditEvent: (event: CommunicationEventItem) => void;
  onDeleteEvent: (event: CommunicationEventItem) => void;
  isDeletingEvent: boolean;
};

export function CommunicationEventsListTab({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  isLoading,
  filteredEvents,
  groupedListEvents,
  userById,
  onEditEvent,
  onDeleteEvent,
  isDeletingEvent,
}: CommunicationEventsListTabProps) {
  return (
    <TabsContent value="list" className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="inline-flex items-center gap-2">
            <List className="h-4 w-4" /> Events Calendar
          </CardTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            <DatePicker
              date={fromDate ? new Date(`${fromDate}T00:00:00`) : undefined}
              onDateChange={(date) => setFromDate(date ? toDateOnly(date) : '')}
              placeholder="From date"
            />
            <DatePicker
              date={toDate ? new Date(`${toDate}T00:00:00`) : undefined}
              onDateChange={(date) => setToDate(date ? toDateOnly(date) : '')}
              placeholder="To date"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading events...</p>
          ) : filteredEvents.length ? (
            (
              [
                ['today', 'Today'],
                ['upcoming', 'Upcoming'],
                ['previous', 'Previous'],
              ] as const
            ).map(([bucket, title]) => (
              <div key={bucket} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {title}
                </p>
                <div className="space-y-3">
                  {groupedListEvents[bucket].length ? (
                    groupedListEvents[bucket].map((event) => (
                      <CommunicationEventCard
                        key={event.messageId}
                        event={event}
                        userById={userById}
                        onEditEvent={onEditEvent}
                        onDeleteEvent={onDeleteEvent}
                        isDeletingEvent={isDeletingEvent}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No {title.toLowerCase()} events.
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No events found.</p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
