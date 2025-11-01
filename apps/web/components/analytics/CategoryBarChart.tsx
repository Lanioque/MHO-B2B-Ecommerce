'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface CategoryBreakdown {
  category: string;
  spending: number;
  orders: number;
  percentage: number;
}

interface CategoryBarChartProps {
  data: CategoryBreakdown[];
}

export function CategoryBarChart({ data }: CategoryBarChartProps) {
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
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase by Category</CardTitle>
        <CardDescription>Spending breakdown by product category</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No category data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                type="number"
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="category"
                type="category"
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent formatter={(value: number) => formatCurrency(value)} />
                }
              />
              <Bar
                dataKey="spending"
                fill="var(--color-spending)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

