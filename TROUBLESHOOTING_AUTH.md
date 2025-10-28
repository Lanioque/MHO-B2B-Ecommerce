# Authentication Redirect Troubleshooting

## Issue
When logged in, visiting `/login` or `/register` doesn't redirect to `/dashboard`.

## Quick Fix Steps

### 1. Restart Development Server
**This is the most common fix!** Middleware changes require a server restart.

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd apps/web
pnpm dev
```

### 2. Clear Browser Cache and Cookies

**Chrome/Edge**:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or go to Application tab → Cookies → Delete all

**Firefox**:
1. Open DevTools (F12)
2. Storage tab → Cookies → Delete all
3. Ctrl+Shift+R for hard reload

### 3. Check Authentication Status

Visit: `http://localhost:3000/debug-auth`

This page will show you:
- ✅ Current authentication status
- 🍪 All authentication cookies
- 📋 Expected behavior

### 4. Check Server Console

Look for middleware logs like:
```
[Middleware] {
  pathname: '/login',
  isAuthenticated: true,
  authToken: false,
  hasNextAuthSession: true,
  hasSession: true,
  allCookies: [ 'next-auth.session-token', 'auth-store', ... ]
}
[Middleware] Redirecting authenticated user to dashboard from: /login
```

## How the Redirect Works

### Three Layers of Protection

1. **Middleware** (`middleware.ts`)
   - Runs before page loads
   - Checks cookies for authentication
   - Redirects at the server level

2. **Server Component** (`page.tsx`)
   - Runs during SSR
   - Calls `auth()` to check session
   - Redirects using `redirect()`

3. **Client State** (Zustand)
   - Manages UI state
   - Syncs with NextAuth
   - Used for conditional rendering

### Redirect Flow

```
User navigates to /login
       ↓
Middleware checks cookies
       ↓
  Is authenticated?
    ├─ Yes → Redirect to /dashboard ✅
    └─ No → Continue to page
       ↓
Page component checks session
       ↓
  Is authenticated?
    ├─ Yes → Redirect to /dashboard ✅
    └─ No → Show login form
```

## Common Issues & Solutions

### Issue 1: Proxy Not Running

**Symptom**: No logs in console

**Solution**:
1. Restart dev server
2. Check `proxy.ts` is in `apps/web/proxy.ts` (root of web app)
3. Verify no syntax errors
4. **Note**: Next.js 16 uses `proxy.ts` instead of `middleware.ts`

### Issue 2: Session Not Detected

**Symptom**: Proxy logs show you're not authenticated but you're logged in

**Solution**:
Visit `/debug-auth` to see your session status and cookies. The proxy uses NextAuth's `req.auth` which should automatically detect the session.

### Issue 3: Redirect Loop

**Symptom**: Page keeps redirecting back and forth

**Solution**:
1. Clear all cookies
2. Sign out completely: Visit `/api/auth/signout`
3. Sign back in

### Issue 4: Still Showing Login Form

**Symptom**: Page loads without redirect, form appears

**Possible Causes**:
1. Server restart needed
2. Browser cached the page
3. Auth session expired

**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check if actually logged in: Visit `/debug-auth`
3. Clear cookies and login again

## Testing the Fix

### Test 1: Authenticated User Cannot Access Auth Pages
```bash
1. Login at /login
2. Verify redirect to /dashboard
3. Manually navigate to /login
   → Should immediately redirect to /dashboard ✅
4. Navigate to /register
   → Should immediately redirect to /dashboard ✅
5. Navigate to /onboarding
   → Should immediately redirect to /dashboard ✅
```

### Test 2: Unauthenticated User Sees Auth Pages
```bash
1. Sign out at /api/auth/signout
2. Navigate to /login
   → Should see login form ✅
3. Navigate to /register
   → Should see register form ✅
```

### Test 3: Protected Routes Redirect to Login
```bash
1. Sign out
2. Navigate to /dashboard
   → Should redirect to /login?callbackUrl=/dashboard ✅
3. Navigate to /products
   → Should redirect to /login?callbackUrl=/products ✅
```

## Manual Testing Commands

### Check Proxy Logs
Run the dev server and watch console:
```bash
cd apps/web
pnpm dev

# Then in another terminal:
curl -v http://localhost:3000/login
# Look for Location header in response
```

### Check Cookies in Terminal
```bash
# Using curl with cookies
curl -v http://localhost:3000/login -c cookies.txt
cat cookies.txt
```

## Verify Implementation

### Check Files Exist
```bash
# Proxy (Next.js 16 auth proxy)
ls apps/web/proxy.ts

# Auth store
ls apps/web/lib/stores/auth-store.ts

# Auth hooks
ls apps/web/lib/hooks/use-auth.ts

# Debug page
ls apps/web/app/debug-auth/page.tsx
```

### Check Proxy Config
`apps/web/proxy.ts` should have (Next.js 16 uses proxy.ts instead of middleware.ts):
```typescript
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user;
  
  // Redirect authenticated users away from auth pages
  const authPages = ['/login', '/register', '/onboarding'];
  if (isAuthenticated && authPages.some(page => pathname.startsWith(page))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  // ... rest of the logic
});
```

## Still Not Working?

### Step-by-Step Debug Process

1. **Visit debug page**: `http://localhost:3000/debug-auth`
   - Check if authenticated: ✅ or ❌
   - Check which cookies exist

2. **Check server console** for proxy logs like:
   ```
   [Proxy] { pathname: '/login', isAuthenticated: true, ... }
   [Proxy] Redirecting authenticated user to dashboard from: /login
   ```

3. **Test login flow**:
   ```
   1. Go to /login
   2. Login
   3. Check if redirected to /dashboard
   4. Open new tab
   5. Go to /login again
   6. Should redirect immediately
   ```

4. **Check browser console** for errors

5. **Check network tab**:
   - Should see 307 redirect from /login to /dashboard
   - Response should have Location header

### Get More Debug Info

Add this to any page:
```typescript
import { auth } from '@/lib/auth';

export default async function TestPage() {
  const session = await auth();
  return (
    <pre>
      {JSON.stringify(session, null, 2)}
    </pre>
  );
}
```

## Environment Check

Ensure you have:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

## Package Versions

Check your `package.json`:
```json
{
  "next-auth": "5.0.0-beta.29",
  "zustand": "^5.0.8",
  "js-cookie": "^3.0.5"
}
```

## If All Else Fails

1. Delete `.next` folder:
   ```bash
   rm -rf apps/web/.next
   ```

2. Reinstall dependencies:
   ```bash
   cd apps/web
   pnpm install
   ```

3. Restart dev server:
   ```bash
   pnpm dev
   ```

4. Clear browser data completely

5. Try incognito/private browsing mode

---

**Need more help?** Check the debug page at `/debug-auth` and share the output.

