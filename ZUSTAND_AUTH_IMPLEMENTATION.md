# Zustand + Cookie Authentication Implementation

## Overview

Implemented a robust client-side authentication state management system using Zustand with secure cookie-based token persistence. This works seamlessly with the existing NextAuth server-side authentication.

## Architecture

```
┌─────────────────────────────────────────┐
│  NextAuth (Server-Side)                 │
│  - JWT tokens in HTTP-only cookies      │
│  - Session management                    │
└──────────────┬──────────────────────────┘
               │
               │ Syncs with
               ▼
┌─────────────────────────────────────────┐
│  Zustand Store (Client-Side)            │
│  - User state management                 │
│  - Token storage in cookies              │
│  - Optimized re-renders                  │
└──────────────┬──────────────────────────┘
               │
               │ Persists to
               ▼
┌─────────────────────────────────────────┐
│  Cookies                                 │
│  - auth-token (7 days expiry)            │
│  - auth-store (Zustand state)            │
│  - Secure, SameSite=Lax                  │
└─────────────────────────────────────────┘
```

## Key Components

### 1. Zustand Auth Store (`lib/stores/auth-store.ts`)

**Features**:
- Centralized authentication state
- Cookie-based persistence
- Automatic token management
- Optimized selectors for performance

**State**:
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Actions**:
- `setUser(user)` - Update user information
- `setToken(token)` - Update auth token in state and cookies
- `login(user, token)` - Authenticate user
- `logout()` - Clear authentication state
- `initialize()` - Initialize store from cookies

**Cookie Storage**:
- Automatic persistence to cookies
- 7-day expiration
- Secure flag in production
- SameSite=Lax for CSRF protection

### 2. Auth Provider (`lib/stores/auth-provider.tsx`)

**Purpose**: Syncs NextAuth session with Zustand store

**How it works**:
1. Monitors NextAuth session changes
2. Updates Zustand store when session changes
3. Initializes store on app mount
4. Ensures client and server state stay in sync

### 3. Auth Hooks (`lib/hooks/use-auth.ts`)

**Available Hooks**:

```typescript
// Complete auth state and actions
const { user, isAuthenticated, isLoading, login, logout } = useAuth();

// Just the user object
const user = useUser();

// Just authentication status
const isAuthenticated = useIsAuthenticated();

// Just the token
const token = useAuthToken();
```

**Benefits**:
- Clean API for components
- Optimized re-renders (selective subscriptions)
- Type-safe

### 4. Proxy (Next.js Auth Proxy - `proxy.ts`)

**Protected Routes**:
- `/dashboard`
- `/my-orgs`
- `/products`

**Auth Routes** (redirect if authenticated):
- `/login`
- `/register`
- `/onboarding`

**Token Checking**:
1. Checks `auth-token` cookie
2. Falls back to NextAuth session cookies
3. Redirects unauthenticated users to `/login`
4. Redirects authenticated users away from auth pages

### 5. Auth Guard Component (`components/auth-guard.tsx`)

**Usage**:
```typescript
<AuthGuard>
  <ProtectedContent />
</AuthGuard>

// With custom redirect
<AuthGuard redirectTo="/login?redirect=true">
  <ProtectedContent />
</AuthGuard>

// With loading fallback
<AuthGuard fallback={<LoadingSpinner />}>
  <ProtectedContent />
</AuthGuard>
```

## Security Features

### 1. Cookie Security
```typescript
Cookies.set('auth-token', token, {
  expires: 7,                    // 7 days
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax',              // CSRF protection
  path: '/',                    // Available site-wide
});
```

### 2. Token Storage
- **Cookies (NOT localStorage)** - More secure, works with SSR
- HTTP-only cookies for NextAuth session (server-managed)
- JavaScript-accessible cookies for Zustand (client-managed)

### 3. Multi-Layer Protection
- Server-side: NextAuth validates requests
- Middleware: Checks cookies before page load
- Client-side: Zustand manages UI state
- Component-level: AuthGuard for granular protection

## Usage Examples

### 1. In a Component

```typescript
'use client';

import { useAuth } from '@/lib/hooks/use-auth';

export function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>Email: {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 2. Protecting a Page

```typescript
'use client';

import { AuthGuard } from '@/components/auth-guard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div>Protected dashboard content</div>
    </AuthGuard>
  );
}
```

### 3. Conditional Rendering

```typescript
'use client';

import { useIsAuthenticated } from '@/lib/hooks/use-auth';

export function Navigation() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <nav>
      {isAuthenticated ? (
        <Link href="/dashboard">Dashboard</Link>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </nav>
  );
}
```

### 4. Accessing Token for API Calls

```typescript
'use client';

import { useAuthToken } from '@/lib/hooks/use-auth';

export function useApi() {
  const token = useAuthToken();

  const fetchData = async () => {
    const response = await fetch('/api/data', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  };

  return { fetchData };
}
```

## Integration with Existing Code

### Login Flow

1. User submits credentials
2. NextAuth validates and creates session
3. AuthProvider detects session change
4. Zustand store is updated with user data
5. Token is stored in cookies
6. User redirected to dashboard

### Logout Flow

1. User clicks logout
2. Zustand `logout()` action called
3. Cookies are cleared
4. NextAuth session is ended
5. User redirected to login

### Page Navigation

1. User navigates to protected route
2. Middleware checks cookies
3. If not authenticated → redirect to login
4. If authenticated → load page
5. AuthProvider syncs state
6. Component renders with user data

## Benefits Over Previous Implementation

### Before (NextAuth Only)
- ❌ Server-side only, no client state management
- ❌ Had to call `useSession()` in every component
- ❌ No optimized re-renders
- ❌ Difficult to share auth state
- ❌ No centralized auth logic

### After (NextAuth + Zustand + Cookies)
- ✅ Client and server state management
- ✅ Centralized auth store
- ✅ Optimized re-renders with selectors
- ✅ Easy auth state access anywhere
- ✅ Cookie-based persistence (secure)
- ✅ Middleware protection
- ✅ Automatic session sync

## Cookie Management

### Cookies Set

1. **`auth-token`**
   - Contains: Session token
   - Expiry: 7 days
   - Usage: Authentication verification

2. **`auth-store`**
   - Contains: Zustand state (user info)
   - Expiry: 7 days
   - Usage: Persist user state across sessions

3. **`next-auth.session-token`** (NextAuth managed)
   - Contains: JWT session token
   - Expiry: Configured in NextAuth
   - Usage: Server-side authentication

### Cookie Access

```typescript
// Read
const token = Cookies.get('auth-token');

// Set
Cookies.set('auth-token', token, options);

// Remove
Cookies.remove('auth-token', { path: '/' });
```

## Performance Optimizations

### 1. Selective Subscriptions
```typescript
// ❌ Bad: Re-renders on any auth state change
const authState = useAuthStore();

// ✅ Good: Only re-renders when user changes
const user = useAuthStore(selectUser);
```

### 2. Zustand Persist Partialize
```typescript
// Only persist essential data
partialize: (state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
}),
```

### 3. Middleware-Level Protection
- Checks authentication before page loads
- No unnecessary page renders
- Instant redirects

## Environment Setup

No additional environment variables needed! The system works with existing NextAuth configuration:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

## Testing

### Test Authentication Flow

1. **Login Test**:
   ```
   1. Navigate to /login
   2. Enter credentials
   3. Check cookies (auth-token should be set)
   4. Verify redirect to /dashboard
   5. Verify Zustand state has user data
   ```

2. **Logout Test**:
   ```
   1. Click logout
   2. Check cookies (should be cleared)
   3. Verify redirect to /login
   4. Verify Zustand state is empty
   ```

3. **Protected Route Test**:
   ```
   1. Clear cookies
   2. Navigate to /dashboard
   3. Should redirect to /login
   4. Login
   5. Should redirect back to /dashboard
   ```

4. **Persistence Test**:
   ```
   1. Login
   2. Refresh page
   3. User should stay logged in
   4. Zustand state should be restored
   ```

## Migration Guide

### For Existing Components

**Old Way (NextAuth only)**:
```typescript
import { useSession } from 'next-auth/react';

function Component() {
  const { data: session } = useSession();
  const user = session?.user;
  // ...
}
```

**New Way (Zustand + NextAuth)**:
```typescript
import { useAuth } from '@/lib/hooks/use-auth';

function Component() {
  const { user, isAuthenticated } = useAuth();
  // ...
}
```

### For API Routes

No changes needed! API routes continue using NextAuth:
```typescript
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ...
}
```

## Troubleshooting

### Issue: User not persisting after refresh
**Solution**: Check browser cookies, ensure `auth-token` and `auth-store` exist

### Issue: Middleware redirect loop
**Solution**: Ensure `/login` and `/dashboard` are correctly configured in middleware

### Issue: Zustand state not syncing
**Solution**: Verify `AuthProvider` is wrapping the app in layout.tsx

### Issue: Cookies not being set
**Solution**: Check `secure` flag (must be false in development)

## Files Created

- `lib/stores/auth-store.ts` - Zustand authentication store
- `lib/stores/auth-provider.tsx` - Session sync provider
- `lib/hooks/use-auth.ts` - Authentication hooks
- `components/providers.tsx` - Combined providers wrapper
- `components/auth-guard.tsx` - Client-side route guard
- `app/debug-auth/page.tsx` - Debug authentication status

## Files Modified

- `proxy.ts` - Updated with auth page redirect logic (Next.js 16 auth proxy)
- `app/layout.tsx` - Added Providers wrapper
- `app/login/LoginForm.tsx` - Integrated Zustand store

## Dependencies Added

```json
{
  "zustand": "^5.0.8",
  "js-cookie": "^3.0.5",
  "@types/js-cookie": "^3.0.6"
}
```

---

**Status**: ✅ Complete  
**Security**: ✅ Cookie-based (secure)  
**Performance**: ✅ Optimized with selectors  
**Compatibility**: ✅ Works with existing NextAuth

