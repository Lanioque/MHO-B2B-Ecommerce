/**
 * Checkout Page
 * Place order from cart
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { BranchSelector } from '@/components/branch-selector';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId') || '00000000-0000-0000-0000-000000000001';
  
  const { cart, isLoading, fetchCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Initialize branch from localStorage or cart
  useEffect(() => {
    const storedBranchId = localStorage.getItem('currentBranchId');
    const branchFromCart = cart?.branchId;
    const branchIdToUse = branchFromCart || storedBranchId;
    
    if (branchIdToUse) {
      setSelectedBranchId(branchIdToUse);
    }
    
    fetchCart(orgId, branchIdToUse || undefined);
  }, [orgId, fetchCart]);

  // Fetch cart when branch changes
  useEffect(() => {
    if (selectedBranchId) {
      fetchCart(orgId, selectedBranchId);
    }
  }, [selectedBranchId, orgId, fetchCart]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(cents / 100);
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!selectedBranchId) {
      setError('Please select a branch before placing your order');
      return;
    }

    setIsPlacingOrder(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: cart.id,
          branchId: selectedBranchId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create order');
      }

      const { order } = await response.json();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/products">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-lg text-gray-600 mb-4">Your cart is empty</p>
              <Link href="/products">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/cart">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Branch Selection */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">Select Branch</h3>
                <p className="text-sm text-gray-600">Choose a branch for this order</p>
              </div>
              <BranchSelector
                currentBranchId={selectedBranchId || undefined}
                onBranchChange={(branchId) => {
                  setSelectedBranchId(branchId);
                  localStorage.setItem('currentBranchId', branchId);
                }}
              />
            </div>
            {!selectedBranchId && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Please select a branch to continue</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border-b pb-4">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">{formatPrice(item.subtotalCents)}</p>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatPrice(cart.subtotalCents)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Place Order */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Place Order</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || !selectedBranchId}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : !selectedBranchId ? (
                    'Select Branch First'
                  ) : (
                    'Place Order'
                  )}
                </Button>

                <p className="mt-4 text-sm text-gray-600 text-center">
                  Your order will be created immediately. Invoice will be generated automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

