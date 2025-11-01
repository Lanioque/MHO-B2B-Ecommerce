/**
 * Payment Success Page
 * Displayed after successful payment or Buy Now Pay Later selection
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Order {
  id: string;
  number: string;
  totalCents: number;
  currency: string;
  status: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const tranRef = searchParams.get('tranRef');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {order ? (
            <>
              <div className="text-center space-y-2">
                <p className="text-gray-600">Thank you for your order</p>
                <p className="text-lg font-semibold">Order #{order.number}</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(order.totalCents, order.currency)}
                </p>
                {tranRef && (
                  <p className="text-sm text-gray-500">
                    Transaction Reference: {tranRef}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Your order has been successfully created. You will receive a confirmation email shortly.
                </p>
              </div>

              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link href={`/orders/${order.id}`}>View Order</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/orders">All Orders</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  Your payment has been processed successfully.
                </p>
                {tranRef && (
                  <p className="text-sm text-gray-500">
                    Transaction Reference: {tranRef}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link href="/orders">View Orders</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}


