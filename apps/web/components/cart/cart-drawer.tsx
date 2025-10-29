/**
 * Cart Drawer Component
 * Sidebar drawer for quick cart view
 */

'use client';

import { useEffect } from 'react';
import { CartItem } from './cart-item';
import { useCart } from '@/lib/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X, ShoppingBag } from 'lucide-react';
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

  // Fetch cart when drawer opens
  useEffect(() => {
    if (isDrawerOpen && !cart) {
      fetchCart(orgId, branchId);
    }
  }, [isDrawerOpen, orgId, branchId, cart, fetchCart]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(cents / 100);
  };

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-2 text-white">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            {cart && cart.itemCount > 0 && (
              <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                {cart.itemCount}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeDrawer}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
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
            <div>
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

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t bg-gray-50 p-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Subtotal:</span>
              <span className="text-blue-600">
                {formatPrice(cart.subtotalCents)}
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link href="/checkout" onClick={closeDrawer} className="block">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Proceed to Checkout
                </Button>
              </Link>
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
      </div>
    </>
  );
}

