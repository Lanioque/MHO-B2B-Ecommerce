/**
 * Payment Error Page
 * Displayed when there's an error processing the payment
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  const errorMessages: Record<string, string> = {
    missing_parameters: 'Missing required parameters. Please try again.',
    processing_error: 'An error occurred while processing your payment. Please try again.',
  };

  const errorMessage = message ? errorMessages[message] || 'An unexpected error occurred.' : 'An unexpected error occurred.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              {errorMessage}
            </p>
            <p className="text-sm text-gray-500">
              If the problem persists, please contact our support team.
            </p>
          </div>

          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <Link href="/quotations">Back to Quotations</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


