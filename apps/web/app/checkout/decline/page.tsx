/**
 * Payment Decline Page
 * Displayed when payment is declined or fails
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

function PaymentDeclineContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const tranRef = searchParams.get('tranRef');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Declined</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Unfortunately, your payment could not be processed.
            </p>
            <p className="text-sm text-gray-500">
              This could be due to insufficient funds, incorrect card details, or your bank declining the transaction.
            </p>
            {tranRef && (
              <p className="text-sm text-gray-500 mt-2">
                Transaction Reference: {tranRef}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">What you can do:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Check your card details and try again</li>
              <li>Contact your bank to ensure the card is active</li>
              <li>Try using a different payment method</li>
            </ul>
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

export default function PaymentDeclinePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <PaymentDeclineContent />
    </Suspense>
  );
}


