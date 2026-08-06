import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { CommunicationEventItem } from '../types/communication-events.types';
import { dateKey, isSameDay, monthLabel } from '../utils/communication-events-date';

type CommunicationEventsCalendarTabProps = {
  activeMonth: Date;
  setActiveMonth: (update: (value: Date) => Date) => void;
  monthDays: Date[];
  eventsByDay: Map<string, CommunicationEventItem[]>;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  setIsDayDialogOpen: (open: boolean) => void;
  selectedDayMeetings: CommunicationEventItem[];
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CommunicationEventsCalendarTab({
  activeMonth,
  setActiveMonth,
  monthDays,
  eventsByDay,
  selectedDate,
  setSelectedDate,
  setIsDayDialogOpen,
  selectedDayMeetings,
}: CommunicationEventsCalendarTabProps) {
  return (
    <TabsContent value="calendar" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{monthLabel(activeMonth)}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-7 gap-2 text-center text-sm text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day) => {
              const dayEvents = eventsByDay.get(dateKey(day)) ?? [];
              const isCurrentMonth = day.getMonth() === activeMonth.getMonth();
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day);
                    setIsDayDialogOpen(true);
                  }}
                  className={`min-h-24 rounded-lg border p-2 text-left transition-colors ${
                    isSelected ? 'border-primary ring-1 ring-primary/60' : 'border-border'
                  } ${isCurrentMonth ? 'bg-card' : 'bg-muted/20 text-muted-foreground'}`}
                >
                  <p className="text-sm font-medium">{day.getDate()}</p>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.messageId}
                        className={`truncate rounded px-2 py-0.5 text-[11px] ${
                          event.inferredType === 'meeting'
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-violet-500/20 text-violet-300'
                        }`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 ? (
                      <p className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events on {selectedDate.toLocaleDateString()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedDayMeetings.length ? (
            selectedDayMeetings.map((meeting) => (
              <div key={meeting.messageId} className="rounded-lg border p-3">
                <p className="font-medium">{meeting.title}</p>
                <p className="text-xs text-muted-foreground">
                  {meeting.threadTitle || 'Untitled thread'}
                </p>
                <div className="mt-2 flex gap-2 text-xs">
                  <Link className="underline" to={`/communication/chat/${meeting.threadId}`}>
                    Open thread
                  </Link>
                  {meeting.link ? (
                    <a href={meeting.link} target="_blank" rel="noreferrer" className="underline">
                      Join meeting
                    </a>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No events on this day.</p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
