'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      // Format currency
      if (title.toLowerCase().includes('revenue') || title.toLowerCase().includes('cost')) {
        return new Intl.NumberFormat('en-AE', {
          style: 'currency',
          currency: 'AED',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      }
      // Format numbers with commas
      return new Intl.NumberFormat('en-AE').format(val);
    }
    return val;
  };

  return (
    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          {icon && <div className="text-blue-500">{icon}</div>}
        </div>
        <CardTitle className="text-3xl">{formatValue(value)}</CardTitle>
      </CardHeader>
      <CardContent>
        {trend && (
          <div className="flex items-center gap-1 text-sm">
            {trend.value > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : trend.value < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <Minus className="h-4 w-4 text-gray-400" />
            )}
            <span
              className={
                trend.value > 0
                  ? 'text-green-600'
                  : trend.value < 0
                  ? 'text-red-600'
                  : 'text-gray-500'
              }
            >
              {trend.value > 0 ? '+' : ''}
              {trend.value.toFixed(1)}%
            </span>
            <span className="text-gray-500">vs previous period</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

