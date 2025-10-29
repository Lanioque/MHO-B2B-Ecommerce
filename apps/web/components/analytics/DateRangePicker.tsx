'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface DateRangePickerProps {
  value?: string;
  onChange: (period: string, startDate: Date, endDate: Date) => void;
}

export function DateRangePicker({ value = '30', onChange }: DateRangePickerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(value);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePeriodChange = (period: string) => {
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

    onChange(period, startDate, endDate);
  };

  // Prevent hydration mismatch by not rendering Select until mounted
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        <div className="w-[180px] h-10 border rounded-md bg-background px-3 py-2 flex items-center text-sm">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
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
        </SelectContent>
      </Select>
    </div>
  );
}

