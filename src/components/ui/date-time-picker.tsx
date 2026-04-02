import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type DateTimePickerProps = {
  value?: Date;
  onChange: (value: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minuteStep?: number;
  minDateTime?: Date;
};

function withTime(base: Date, hour: number, minute: number) {
  const next = new Date(base);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick date and time',
  className,
  disabled,
  minuteStep = 5,
  minDateTime,
}: DateTimePickerProps) {
  const [hourMode, setHourMode] = useState<'24h' | '12h'>('24h');
  const selectedHour = value?.getHours() ?? 0;
  const selectedMinute = value?.getMinutes() ?? 0;
  const selectedPeriod: 'am' | 'pm' = selectedHour >= 12 ? 'pm' : 'am';
  const selectedHour12 = selectedHour % 12 === 0 ? 12 : selectedHour % 12;
  const minDayStart = minDateTime
    ? new Date(minDateTime.getFullYear(), minDateTime.getMonth(), minDateTime.getDate())
    : null;
  const isSelectedOnMinDay =
    Boolean(value && minDateTime) && value && minDateTime && isSameDay(value, minDateTime);
  const minimumHourForSelectedDay = isSelectedOnMinDay && minDateTime ? minDateTime.getHours() : 0;
  const minimumMinuteForSelectedHour =
    isSelectedOnMinDay && minDateTime && selectedHour === minDateTime.getHours()
      ? minDateTime.getMinutes()
      : 0;

  const clampToMinDateTime = (next: Date) => {
    if (!minDateTime) return next;
    return next.getTime() < minDateTime.getTime() ? new Date(minDateTime) : next;
  };

  const minuteOptions = useMemo(() => {
    const safeStep = Math.max(1, Math.min(30, minuteStep));
    const values: number[] = [];
    for (let minute = 0; minute < 60; minute += safeStep) {
      values.push(minute);
    }
    return values;
  }, [minuteStep]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarClock className="mr-2 h-4 w-4" />
          {value ? format(value, hourMode === '24h' ? 'PPP HH:mm' : 'PPP p') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 space-y-3" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(selectedDate) => {
            if (!selectedDate) {
              onChange(undefined);
              return;
            }
            onChange(clampToMinDateTime(withTime(selectedDate, selectedHour, selectedMinute)));
          }}
          disabled={minDayStart ? (date) => date.getTime() < minDayStart.getTime() : undefined}
          initialFocus
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2 flex gap-2 rounded-md border p-1">
            <Button
              type="button"
              variant={hourMode === '24h' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setHourMode('24h')}
            >
              24h
            </Button>
            <Button
              type="button"
              variant={hourMode === '12h' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setHourMode('12h')}
            >
              12h
            </Button>
          </div>
          <Select
            value={String(hourMode === '24h' ? selectedHour : selectedHour12)}
            onValueChange={(nextHour) => {
              const base = value ?? new Date();
              if (hourMode === '24h') {
                onChange(clampToMinDateTime(withTime(base, Number(nextHour), selectedMinute)));
                return;
              }
              const hour12 = Number(nextHour);
              const normalizedHour12 = hour12 === 12 ? 0 : hour12;
              const nextHour24 = selectedPeriod === 'pm' ? normalizedHour12 + 12 : normalizedHour12;
              onChange(clampToMinDateTime(withTime(base, nextHour24, selectedMinute)));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
              {hourMode === '24h'
                ? Array.from({ length: 24 }, (_, hour) =>
                    hour < minimumHourForSelectedDay ? null : (
                      <SelectItem key={hour} value={String(hour)}>
                        {String(hour).padStart(2, '0')}
                      </SelectItem>
                    ),
                  )
                : Array.from({ length: 12 }, (_, index) => {
                    const hour = index + 1;
                    const normalizedHour12 = hour === 12 ? 0 : hour;
                    const hour24 =
                      selectedPeriod === 'pm' ? normalizedHour12 + 12 : normalizedHour12;
                    if (hour24 < minimumHourForSelectedDay) return null;
                    return (
                      <SelectItem key={hour} value={String(hour)}>
                        {String(hour).padStart(2, '0')}
                      </SelectItem>
                    );
                  })}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedMinute)}
            onValueChange={(nextMinute) => {
              const base = value ?? new Date();
              onChange(withTime(base, selectedHour, Number(nextMinute)));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Minute" />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions.map((minute) =>
                minute < minimumMinuteForSelectedHour ? null : (
                  <SelectItem key={minute} value={String(minute)}>
                    {String(minute).padStart(2, '0')}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          {hourMode === '12h' ? (
            <Select
              value={selectedPeriod}
              onValueChange={(nextPeriod) => {
                const base = value ?? new Date();
                const normalizedHour12 = selectedHour12 === 12 ? 0 : selectedHour12;
                const nextHour24 = nextPeriod === 'pm' ? normalizedHour12 + 12 : normalizedHour12;
                onChange(clampToMinDateTime(withTime(base, nextHour24, selectedMinute)));
              }}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="am">AM</SelectItem>
                <SelectItem value="pm">PM</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
