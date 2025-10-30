'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={displayData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="productName"
                angle={-45}
                textAnchor="end"
                height={120}
                tick={{ fontSize: 12 }}
              />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="spending" fill="#10b981" name="Spent Amount" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

