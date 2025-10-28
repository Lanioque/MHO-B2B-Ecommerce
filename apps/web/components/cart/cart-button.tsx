/**
 * Cart Button Component
 * Header button with item count badge that opens cart drawer
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import { Badge } from '@/components/ui/badge';

interface CartButtonProps {
  orgId: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function CartButton({ orgId, variant = 'outline' }: CartButtonProps) {
  const { itemCount, toggleDrawer, fetchCart } = useCart();

  // Fetch cart on mount
  useEffect(() => {
    fetchCart(orgId);
  }, [orgId, fetchCart]);

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={toggleDrawer}
      className="relative"
    >
      <ShoppingCart className="w-4 h-4" />
      {itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
      <span className="ml-2 hidden sm:inline">Cart</span>
    </Button>
  );
}

