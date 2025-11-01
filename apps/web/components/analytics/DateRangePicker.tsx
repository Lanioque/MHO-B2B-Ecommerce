'use client';

import { useState, useEffect, useRef } from 'react';
import { type DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value?: string;
  onChange: (period: string, startDate: Date, endDate: Date) => void;
  showCustomRange?: boolean;
}

export function DateRangePicker({ 
  value = '30', 
  onChange,
  showCustomRange = true,
}: DateRangePickerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(value);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const lastRangeRef = useRef<string>('');
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Only call onChange when range is complete AND different (prevent rerender during selection)
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const rangeKey = `${dateRange.from.getTime()}-${dateRange.to.getTime()}`;
      
      // Only call onChange if this is a new range (prevent infinite loop and rerender)
      if (lastRangeRef.current !== rangeKey) {
        lastRangeRef.current = rangeKey;
        const startDate = startOfDay(dateRange.from);
        const endDate = endOfDay(dateRange.to);
        // Use ref to avoid dependency on onChange (prevents rerender cascade)
        onChangeRef.current('custom', startDate, endDate);
      }
    }
  }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

  const handlePeriodChange = (period: string) => {
    if (period === 'custom') {
      return;
    }

    setSelectedPeriod(period);
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case '7':
        startDate = subDays(endDate, 7);
        break;
      case '30':
        startDate = subDays(endDate, 30);
        break;
      case '90':
        startDate = subDays(endDate, 90);
        break;
      case '365':
        startDate = subDays(endDate, 365);
        break;
      default:
        startDate = subDays(endDate, 30);
    }

    setDateRange({ from: startDate, to: endDate });
    onChange(period, startDate, endDate);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return 'Select date range';
    if (!dateRange.to) return format(dateRange.from, 'LLL dd, y');
    return `${format(dateRange.from, 'LLL dd, y')} - ${format(dateRange.to, 'LLL dd, y')}`;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <CalendarIcon className="h-4 w-4 text-gray-500" />
      <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
          <SelectItem value="365">Last year</SelectItem>
          {showCustomRange && <SelectItem value="custom">Custom range</SelectItem>}
        </SelectContent>
      </Select>

      {showCustomRange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
