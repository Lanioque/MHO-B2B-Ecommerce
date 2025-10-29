'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';

interface Quotation {
  id: string;
  number: string;
  totalCents: number;
  status: string;
  validUntil?: Date | null;
  createdAt: Date;
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
}

interface LatestQuotationsTableProps {
  quotations: Quotation[];
  onConvertToOrder?: (quotationId: string) => void;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
  CONVERTED: 'bg-purple-100 text-purple-800',
};

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

export function LatestQuotationsTable({
  quotations,
  onConvertToOrder,
}: LatestQuotationsTableProps) {
  const [converting, setConverting] = useState<string | null>(null);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(cents / 100);
  };

  const handleConvert = async (quotationId: string) => {
    if (converting) return;

    setConverting(quotationId);
    try {
      if (onConvertToOrder) {
        await onConvertToOrder(quotationId);
      }
    } catch (error) {
      console.error('Failed to convert quotation:', error);
    } finally {
      setConverting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Quotations</CardTitle>
        <CardDescription>Most recent quotations from your organization</CardDescription>
      </CardHeader>
      <CardContent>
        {quotations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No quotations found for this period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Quotation ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Valid Until</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm">
                      {format(new Date(quotation.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">{quotation.number}</td>
                    <td className="py-3 px-4 text-sm">
                      {quotation.customer
                        ? `${quotation.customer.firstName || ''} ${quotation.customer.lastName || ''}`.trim() || quotation.customer.email
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      {formatCurrency(quotation.totalCents)}
                    </td>
                    <td className="py-3 px-4 text-sm text-center">
                      {quotation.validUntil
                        ? format(new Date(quotation.validUntil), 'MMM dd, yyyy')
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        className={statusColors[quotation.status] || 'bg-gray-100 text-gray-800'}
                      >
                        {formatStatus(quotation.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConvert(quotation.id)}
                          disabled={
                            converting === quotation.id ||
                            quotation.status === 'CONVERTED' ||
                            quotation.status === 'REJECTED' ||
                            quotation.status === 'EXPIRED'
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {converting === quotation.id ? 'Converting...' : 'Convert'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

