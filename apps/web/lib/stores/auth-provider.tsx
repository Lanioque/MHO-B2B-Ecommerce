/**
 * Auth Provider
 * Initializes and syncs authentication state with server
 */

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from './auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setUser, logout, initialize } = useAuthStore();

  // Initialize auth store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync NextAuth session with Zustand store
  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        memberships: session.user.memberships,
      });
    } else {
      logout();
    }
  }, [session, status, setUser, logout]);

  return <>{children}</>;
}

