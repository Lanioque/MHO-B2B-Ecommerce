/**
 * Cart Drawer Component
 * Sidebar drawer for quick cart view
 */

'use client';

import { useEffect, useState } from 'react';
import { CartItem } from './cart-item';
import { useCart } from '@/lib/hooks/use-cart';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface CartDrawerProps {
  orgId: string;
  branchId?: string;
}

export function CartDrawer({ orgId, branchId }: CartDrawerProps) {
  const {
    cart,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    fetchCart,
  } = useCart();

  const [requestingQuote, setRequestingQuote] = useState(false);
  const [quoteId, setQuoteId] = useState<string | null>(null);

  // Fetch cart when drawer opens (always refresh to keep in sync)
  useEffect(() => {
    if (isDrawerOpen) {
      fetchCart(orgId, branchId);
    }
  }, [isDrawerOpen, orgId, branchId, fetchCart]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(cents / 100);
  };

  const handleRequestQuote = async () => {
    try {
      setRequestingQuote(true);
      // Resolve branch: prefer prop -> cart.branchId -> localStorage
      const resolvedBranchId = branchId || cart?.branchId || (typeof window !== 'undefined' ? localStorage.getItem('currentBranchId') || undefined : undefined);
      const url = new URL('/api/quotations/from-cart', window.location.origin);
      if (resolvedBranchId) url.searchParams.set('branchId', resolvedBranchId);
      const res = await fetch(url.toString(), { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to request quote');
      setQuoteId(json.quotation?.id || null);
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Could not request a quote. Please try again.');
    } finally {
      setRequestingQuote(false);
    }
  };

  if (!isDrawerOpen) return null;

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" className="w-full max-w-[90vw] sm:max-w-md flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <SheetTitle className="text-white">Shopping Cart</SheetTitle>
              {cart && cart.itemCount > 0 && (
                <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                  {cart.itemCount}
                </span>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          <div className="px-5 py-4">
            {!cart || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Add products to get started
                </p>
                <Button
                  onClick={closeDrawer}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t bg-gray-50 px-5 py-4 space-y-4">
            {/* Subtotal hidden in quote flow */}
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-blue-600">Price on request</span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={handleRequestQuote}
                disabled={requestingQuote}
              >
                {requestingQuote ? 'Requesting...' : 'Request a Quote'}
              </Button>
              {quoteId && (
                <p className="text-xs text-green-600 text-center">Quote requested. ID: {quoteId}</p>
              )}
              <Link href="/cart" onClick={closeDrawer} className="block">
                <Button variant="outline" className="w-full">
                  View Full Cart
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={closeDrawer}
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

