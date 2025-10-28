/**
 * Cart Store (Zustand)
 * Client-side state management for shopping cart
 */

import { create } from 'zustand';
import { CartResponseDto } from '@/lib/dto/CartDto';

interface CartState {
  cart: CartResponseDto | null;
  isLoading: boolean;
  isDrawerOpen: boolean;
  error: string | null;
}

interface CartActions {
  setCart: (cart: CartResponseDto | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  
  // API actions
  fetchCart: (orgId: string) => Promise<void>;
  addItem: (productId: string, quantity: number, orgId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: (orgId: string) => Promise<void>;
}

type CartStore = CartState & CartActions;

/**
 * Helper to get auth token for API calls
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Get token from cookie
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
  if (authCookie) {
    return authCookie.split('=')[1];
  }
  return null;
}

/**
 * Helper to make authenticated API calls
 */
async function fetchApi(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const useCartStore = create<CartStore>((set, get) => ({
  // Initial state
  cart: null,
  isLoading: false,
  isDrawerOpen: false,
  error: null,

  // Simple state setters
  setCart: (cart) => set({ cart, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  // API actions
  fetchCart: async (orgId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchApi(`/api/cart?orgId=${orgId}`);
      set({ cart: data.cart, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch cart';
      set({ error: message, isLoading: false });
      console.error('Error fetching cart:', error);
    }
  },

  addItem: async (productId: string, quantity: number, orgId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchApi(`/api/cart?orgId=${orgId}`, {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
      set({ cart: data.cart, isLoading: false });
      
      // Optionally open drawer after adding item
      // set({ isDrawerOpen: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add item';
      set({ error: message, isLoading: false });
      console.error('Error adding item to cart:', error);
      throw error; // Re-throw so UI can handle it
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const currentCart = get().cart;
    if (!currentCart) return;

    // Optimistic update
    const optimisticCart = {
      ...currentCart,
      items: currentCart.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity, subtotalCents: item.unitPriceCents * quantity }
          : item
      ),
    };
    
    // Recalculate totals
    optimisticCart.subtotalCents = optimisticCart.items.reduce(
      (sum, item) => sum + item.subtotalCents, 0
    );
    optimisticCart.itemCount = optimisticCart.items.reduce(
      (sum, item) => sum + item.quantity, 0
    );
    
    set({ cart: optimisticCart, error: null });

    try {
      const data = await fetchApi(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      set({ cart: data.cart });
    } catch (error) {
      // Revert on error
      set({ cart: currentCart, error: 'Failed to update quantity' });
      console.error('Error updating quantity:', error);
      throw error;
    }
  },

  removeItem: async (itemId: string) => {
    const currentCart = get().cart;
    if (!currentCart) return;

    // Optimistic update
    const optimisticCart = {
      ...currentCart,
      items: currentCart.items.filter(item => item.id !== itemId),
    };
    
    // Recalculate totals
    optimisticCart.subtotalCents = optimisticCart.items.reduce(
      (sum, item) => sum + item.subtotalCents, 0
    );
    optimisticCart.itemCount = optimisticCart.items.reduce(
      (sum, item) => sum + item.quantity, 0
    );
    
    set({ cart: optimisticCart, error: null });

    try {
      const data = await fetchApi(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      set({ cart: data.cart });
    } catch (error) {
      // Revert on error
      set({ cart: currentCart, error: 'Failed to remove item' });
      console.error('Error removing item:', error);
      throw error;
    }
  },

  clearCart: async (orgId: string) => {
    set({ isLoading: true, error: null });
    try {
      await fetchApi(`/api/cart?orgId=${orgId}`, {
        method: 'DELETE',
      });
      set({ cart: null, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear cart';
      set({ error: message, isLoading: false });
      console.error('Error clearing cart:', error);
      throw error;
    }
  },
}));

// Selectors for optimized re-renders
export const selectCart = (state: CartStore) => state.cart;
export const selectItemCount = (state: CartStore) => state.cart?.itemCount || 0;
export const selectSubtotal = (state: CartStore) => state.cart?.subtotalCents || 0;
export const selectIsLoading = (state: CartStore) => state.isLoading;
export const selectIsDrawerOpen = (state: CartStore) => state.isDrawerOpen;
export const selectError = (state: CartStore) => state.error;

