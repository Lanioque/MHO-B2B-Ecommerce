'use client';

import { PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

interface OrdersByStatus {
  status: string;
  count: number;
  spending: number;
}

interface StatusPieChartProps {
  data: OrdersByStatus[];
}

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

export function StatusPieChart({ data }: StatusPieChartProps) {
  // Generate chart config dynamically based on statuses
  const chartConfig: ChartConfig = data.reduce((acc, item, index) => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];
    acc[item.status] = {
      label: formatStatus(item.status),
      color: colors[index % colors.length],
    };
    return acc;
  }, {} as ChartConfig);

  // Add count to config for tooltip
  chartConfig.count = {
    label: 'Count',
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
          <CardDescription>Distribution of orders by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            No order data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data with fill colors
  const chartData = data.map((item, index) => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];
    return {
      ...item,
      fill: colors[index % colors.length],
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by Status</CardTitle>
        <CardDescription>Distribution of orders by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value: number, name: string) => {
                    if (name === 'count') {
                      return [value, 'Count'];
                    }
                    return [value, formatStatus(name)];
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, percent }) =>
                `${formatStatus(status)}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={100}
              dataKey="count"
              nameKey="status"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


