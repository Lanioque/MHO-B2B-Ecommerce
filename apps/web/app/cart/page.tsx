/**
 * Cart Page
 * Dedicated full cart view with all items and checkout
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useCart } from '@/lib/hooks/use-cart';
import { CartItem } from '@/components/cart/cart-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function CartContent() {
  const searchParams = useSearchParams();
  // Default org ID from seed - TODO: Get from auth context or branch selector
  const orgId = searchParams.get('orgId') || '00000000-0000-0000-0000-000000000001';
  
  const {
    cart,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
    fetchCart,
  } = useCart();

  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const [branchId, setBranchId] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('currentBranchId') : null;
    if (stored) setBranchId(stored);
    fetchCart(orgId, stored || undefined);
  }, [orgId, fetchCart]);

  useEffect(() => {
    if (branchId) {
      fetchCart(orgId, branchId);
    }
  }, [branchId, orgId, fetchCart]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(cents / 100);
  };

  const [requestingQuote, setRequestingQuote] = useState(false);
  const [quoteId, setQuoteId] = useState<string | null>(null);

  const handleRequestQuote = async () => {
    try {
      setRequestingQuote(true);
      const resolvedBranchId = cart?.branchId || branchId || (typeof window !== 'undefined' ? localStorage.getItem('currentBranchId') || undefined : undefined);
      const url = new URL('/api/quotations/from-cart', window.location.origin);
      if (resolvedBranchId) url.searchParams.set('branchId', resolvedBranchId);
      const res = await fetch(url.toString(), { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to request quote');
      }
      setQuoteId(json.quotation?.id || null);
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Could not request a quote. Please try again.');
    } finally {
      setRequestingQuote(false);
    }
  };

  const handleClearCart = async () => {
    await clearCart(orgId);
    setIsClearDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/products">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Products
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Shopping Cart
              </h1>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-24 w-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <Card className="max-w-2xl mx-auto shadow-xl">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h2>
                <p className="text-gray-600 mb-8">
                  Start shopping to add items to your cart
                </p>
                <Link href="/products">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    Cart Items ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsClearDialogOpen(true)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Cart
                  </Button>
                </CardHeader>
                <CardContent className="divide-y">
                  {cart.items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatPrice(cart.subtotalCents)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items</span>
                      <span className="font-medium">{cart.itemCount}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold mb-4">
                      <span>Total</span>
                      <span className="text-blue-600">Price on request</span>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      size="lg"
                      onClick={handleRequestQuote}
                      disabled={requestingQuote}
                    >
                      {requestingQuote ? 'Requesting...' : 'Request a Quote'}
                    </Button>

                    {quoteId && (
                      <p className="text-xs text-green-600 text-center mt-3">
                        Quote requested. Reference ID: {quoteId}
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <Link href="/products">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Clear Cart Confirmation Dialog */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear your cart? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCart}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-48 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}

