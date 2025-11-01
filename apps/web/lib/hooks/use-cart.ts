/**
 * Cart Hooks
 * Convenient hooks for accessing cart state and actions
 */

'use client';

import {
  useCartStore,
  selectCart,
  selectItemCount,
  selectSubtotal,
  selectIsLoading,
  selectIsDrawerOpen,
  selectError,
} from '@/lib/stores/cart-store';

/**
 * Main cart hook - provides all cart functionality
 */
export function useCart() {
  const cart = useCartStore(selectCart);
  const itemCount = useCartStore(selectItemCount);
  const subtotal = useCartStore(selectSubtotal);
  const isLoading = useCartStore(selectIsLoading);
  const error = useCartStore(selectError);
  const isDrawerOpen = useCartStore(selectIsDrawerOpen);

  const fetchCart = useCartStore((state) => state.fetchCart);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const toggleDrawer = useCartStore((state) => state.toggleDrawer);

  return {
    cart,
    itemCount,
    subtotal,
    isLoading,
    error,
    isDrawerOpen,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };
}

