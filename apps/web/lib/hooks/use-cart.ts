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

/**
 * Hook for just the cart data
 */
export function useCartData() {
  return useCartStore(selectCart);
}

/**
 * Hook for just the item count (for badge)
 */
export function useCartItemCount() {
  return useCartStore(selectItemCount);
}

/**
 * Hook for just the subtotal
 */
export function useCartSubtotal() {
  return useCartStore(selectSubtotal);
}

/**
 * Hook for cart drawer state
 */
export function useCartDrawer() {
  const isOpen = useCartStore(selectIsDrawerOpen);
  const open = useCartStore((state) => state.openDrawer);
  const close = useCartStore((state) => state.closeDrawer);
  const toggle = useCartStore((state) => state.toggleDrawer);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Hook for cart actions only
 */
export function useCartActions() {
  const fetchCart = useCartStore((state) => state.fetchCart);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  return {
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}

