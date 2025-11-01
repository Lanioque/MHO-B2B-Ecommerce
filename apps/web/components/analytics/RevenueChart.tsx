'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { differenceInDays, parseISO } from 'date-fns';

interface SpendingDataPoint {
  date: string;
  spending: number;
  orders: number;
}

interface SpendingChartProps {
  data: SpendingDataPoint[];
}

export function RevenueChart({ data }: SpendingChartProps) {
  // Determine date range from data
  const getDateRange = () => {
    if (data.length === 0) return 0;
    const firstDate = parseISO(data[0].date);
    const lastDate = parseISO(data[data.length - 1].date);
    return differenceInDays(lastDate, firstDate);
  };

  const dateRange = getDateRange();

  // Format date for display based on date range
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    
    // Less than 8 days: Show day name and date (e.g., "Mon, Jan 1")
    if (dateRange <= 7) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    // 8-35 days: Show month and day (e.g., "Jan 1")
    if (dateRange <= 35) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    // 36-90 days: Show week number or month/day (e.g., "Jan 1")
    if (dateRange <= 90) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    // More than 90 days: Show month and year (e.g., "Jan 2025")
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Calculate tick interval based on data points
  const calculateTickInterval = () => {
    if (data.length === 0) return 1;
    
    // For small date ranges, show all points
    if (dateRange <= 7) return 1;
    
    // For medium ranges, show every other point
    if (dateRange <= 35) return Math.max(1, Math.floor(data.length / 15));
    
    // For larger ranges, show fewer points
    if (dateRange <= 90) return Math.max(1, Math.floor(data.length / 20));
    
    // For very large ranges, show even fewer
    return Math.max(1, Math.floor(data.length / 15));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartConfig = {
    spending: {
      label: 'Spent Amount',
      color: 'hsl(var(--chart-1))',
    },
    orders: {
      label: 'Orders',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spent Amount Over Time</CardTitle>
        <CardDescription>Daily spending and order count</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No spending data available for this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: dateRange > 7 ? 60 : 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                angle={dateRange > 7 ? -45 : 0}
                textAnchor={dateRange > 7 ? 'end' : 'middle'}
                height={dateRange > 7 ? 80 : 40}
                interval={calculateTickInterval()}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left" 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                formatter={(value: any) => {
                  return formatCurrency(Number(value));
                }}
                labelFormatter={(label) => {
                      const date = parseISO(label as string);
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long', 
                        day: 'numeric',
                  });
                }}
                  />
                }
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spending"
                stroke="var(--color-spending)"
                strokeWidth={2}
                dot={{ r: dateRange <= 7 ? 4 : 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="var(--color-orders)"
                strokeWidth={2}
                dot={{ r: dateRange <= 7 ? 4 : 3 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

