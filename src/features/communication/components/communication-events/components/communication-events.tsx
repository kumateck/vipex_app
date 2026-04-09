import { Bell, CalendarDays, List, Plus, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateEditEventDialog } from '../create-edit-event-dialog';
import { SelectedDayEventsDialog } from '../selected-day-events-dialog';
import { useCommunicationEventsData } from '../hooks/use-communication-events-data';
import { useCommunicationEventForm } from '../hooks/use-communication-event-form';
import { CommunicationEventParticipants } from './communication-event-participants';
import { CommunicationEventsCalendarTab } from './communication-events-calendar-tab';
import { CommunicationEventsListTab } from './communication-events-list-tab';

export function CommunicationEvents() {
  const data = useCommunicationEventsData();
  const form = useCommunicationEventForm({
    selectedDate: data.selectedDate,
    threads: data.threads,
    userOptions: data.userOptions,
    userById: data.userById,
    refetch: data.refetch,
  });

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Events Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Manage your meetings, calls, and other scheduled events with alarms.
            </p>
            <Button variant="outline" size="icon" className="mt-3 h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="relative">
              <Bell className="mr-2 h-4 w-4" />
              Reminders
              {data.reminderEvents.length ? (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {data.reminderEvents.length}
                </span>
              ) : null}
            </Button>
            <Button onClick={() => form.openCreateDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </div>
        </div>

        {data.reminderEvents.length ? (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reminder Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.reminderEvents.slice(0, 5).map((event) => (
                <div
                  key={`reminder-${event.messageId}`}
                  className="flex items-center justify-between gap-2 rounded-md border bg-background/70 p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Starts at{' '}
                      {event.startsAtDate
                        ? event.startsAtDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                      {' • '}reminder {event.reminderMinutes}m before
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        data.setDismissedReminderEventIds((prev) => [...prev, event.messageId])
                      }
                    >
                      Dismiss
                    </Button>
                    <Link
                      className="text-xs underline"
                      to={`/communication/chat/${event.threadId}`}
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Filter by participants</p>
          <MultiSelect
            options={data.userOptions}
            value={data.participantFilterUserIds}
            onValueChange={data.setParticipantFilterUserIds}
            getLabel={(option) => option.fullname || option.email || 'Unknown user'}
            getValue={(option) => option.id}
            placeholder="All participants"
            searchPlaceholder="Search users..."
            emptyMessage="No users found."
          />
        </div>

        <Tabs
          value={data.view}
          onValueChange={(value) => data.setView(value as 'list' | 'calendar')}
          className="space-y-4"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>

          <CommunicationEventsCalendarTab
            activeMonth={data.activeMonth}
            setActiveMonth={data.setActiveMonth}
            monthDays={data.monthDays}
            eventsByDay={data.eventsByDay}
            selectedDate={data.selectedDate}
            setSelectedDate={data.setSelectedDate}
            setIsDayDialogOpen={data.setIsDayDialogOpen}
            selectedDayMeetings={data.selectedDayMeetings}
          />

          <CommunicationEventsListTab
            search={data.search}
            setSearch={data.setSearch}
            typeFilter={data.typeFilter}
            setTypeFilter={data.setTypeFilter}
            statusFilter={data.statusFilter}
            setStatusFilter={data.setStatusFilter}
            fromDate={data.fromDate}
            setFromDate={data.setFromDate}
            toDate={data.toDate}
            setToDate={data.setToDate}
            isLoading={data.isLoading}
            filteredEvents={data.filteredEvents}
            groupedListEvents={data.groupedListEvents}
            userById={data.userById}
            onEditEvent={form.openEditDialog}
            onDeleteEvent={(event) => {
              void form.onDeleteEvent(event);
            }}
            isDeletingEvent={form.isDeletingEvent}
          />
        </Tabs>

        <SelectedDayEventsDialog
          open={data.isDayDialogOpen}
          onOpenChange={data.setIsDayDialogOpen}
          title={data.selectedDayTitle}
          selectedDate={data.selectedDate}
          selectedDayMeetings={data.selectedDayMeetings}
          groupedSelectedDayMeetings={data.groupedSelectedDayMeetings}
          participantDisplay={(event) => (
            <CommunicationEventParticipants event={event} userById={data.userById} />
          )}
          onEditEvent={form.openEditDialog}
          onDeleteEvent={form.onDeleteEvent}
          isDeletingEvent={form.isDeletingEvent}
          onCreateEvent={form.openCreateDialog}
        />

        <CreateEditEventDialog
          open={form.isCreateDialogOpen}
          onOpenChange={form.setIsCreateDialogOpen}
          editingEventMessageId={form.editingEventMessageId}
          eventTitle={form.eventTitle}
          onEventTitleChange={form.setEventTitle}
          eventType={form.eventType}
          onEventTypeChange={form.setEventType}
          eventStartsAt={form.eventStartsAt}
          onEventStartsAtChange={form.setEventStartsAt}
          eventThreadId={form.eventThreadId}
          onEventThreadIdChange={form.setEventThreadId}
          threads={data.threads}
          eventLink={form.eventLink}
          onEventLinkChange={form.setEventLink}
          userOptions={data.userOptions}
          eventParticipantUserIds={form.eventParticipantUserIds}
          onEventParticipantUserIdsChange={form.setEventParticipantUserIds}
          eventReminderMinutes={form.eventReminderMinutes}
          onEventReminderMinutesChange={form.setEventReminderMinutes}
          eventDescription={form.eventDescription}
          onEventDescriptionChange={form.setEventDescription}
          onSubmit={() => void form.submitCreateEvent()}
          isCreatingEvent={form.isCreatingEvent}
          isUpdatingEvent={form.isUpdatingEvent}
        />
      </div>
    </ScrollableWrapper>
  );
}
