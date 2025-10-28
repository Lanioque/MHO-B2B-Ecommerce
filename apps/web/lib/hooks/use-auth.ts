/**
 * Auth Hooks
 * Convenient hooks for accessing authentication state
 */

'use client';

import { useAuthStore, selectUser, selectIsAuthenticated, selectIsLoading } from '../stores/auth-store';

export function useAuth() {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}

export function useUser() {
  return useAuthStore(selectUser);
}

export function useIsAuthenticated() {
  return useAuthStore(selectIsAuthenticated);
}

export function useAuthToken() {
  return useAuthStore((state) => state.token);
}

