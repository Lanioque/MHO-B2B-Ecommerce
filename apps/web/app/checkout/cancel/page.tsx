/**
 * Payment Cancel Page
 * Displayed when user cancels the payment process
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const tranRef = searchParams.get('tranRef');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              You have cancelled the payment process.
            </p>
            <p className="text-sm text-gray-500">
              Your order has been created but payment is pending. You can complete the payment later.
            </p>
            {tranRef && (
              <p className="text-sm text-gray-500 mt-2">
                Transaction Reference: {tranRef}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {orderId ? (
              <>
                <Button asChild className="flex-1">
                  <Link href={`/orders/${orderId}`}>View Order</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/quotations">Back to Quotations</Link>
                </Button>
              </>
            ) : (
              <Button asChild className="w-full">
                <Link href="/quotations">Back to Quotations</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


