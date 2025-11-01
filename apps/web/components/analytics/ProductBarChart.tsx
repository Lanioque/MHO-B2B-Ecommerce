'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ProductBreakdown {
  productId: string;
  productName: string;
  sku: string;
  spending: number;
  orders: number;
  quantity: number;
}

interface ProductBarChartProps {
  data: ProductBreakdown[];
}

export function ProductBarChart({ data }: ProductBarChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Limit to top 10 products
  const displayData = data.slice(0, 10);

  const chartConfig = {
    spending: {
      label: 'Spent Amount',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products by Spent Amount</CardTitle>
        <CardDescription>Top 10 products by spending</CardDescription>
      </CardHeader>
      <CardContent>
        {displayData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No product data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart
              data={displayData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="productName"
                angle={-45}
                textAnchor="end"
                height={120}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent formatter={(value: any) => formatCurrency(Number(value))} />
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

