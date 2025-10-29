'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';

interface Order {
  id: string;
  number: string;
  totalCents: number;
  status: string;
  createdAt: Date;
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
}

interface LatestOrdersTableProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  AWAITING_PAYMENT: 'bg-orange-100 text-orange-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
};

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

export function LatestOrdersTable({ orders }: LatestOrdersTableProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Orders</CardTitle>
        <CardDescription>Most recent orders from your organization</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No orders found for this period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">{order.number}</td>
                    <td className="py-3 px-4 text-sm">
                      {order.customer
                        ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.email
                        : 'Guest'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      {formatCurrency(order.totalCents)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}
                      >
                        {formatStatus(order.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {orders.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              href="/orders"
              className="text-sm text-blue-600 hover:text-blue-800 text-sm"
            >
              View all orders →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

