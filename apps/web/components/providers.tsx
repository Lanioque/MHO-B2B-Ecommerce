/**
 * Providers Component
 * Wraps the app with necessary providers (NextAuth + Zustand Auth)
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/stores/auth-provider';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </SessionProvider>
  );
}

