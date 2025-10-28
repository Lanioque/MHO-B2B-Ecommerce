/**
 * Providers Component
 * Wraps the app with necessary providers (NextAuth + Zustand Auth)
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/stores/auth-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}

