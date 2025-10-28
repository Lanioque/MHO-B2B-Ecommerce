import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user;

  // Log authentication status for debugging
  console.log('[Proxy]', {
    pathname,
    isAuthenticated,
    hasAuth: !!req.auth,
    userId: req.auth?.user?.id,
  });

  // Redirect authenticated users away from auth pages
  const authPages = ['/login', '/register', '/onboarding'];
  if (isAuthenticated && authPages.some(page => pathname.startsWith(page))) {
    console.log('[Proxy] Redirecting authenticated user to dashboard from:', pathname);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Public routes - allow without authentication
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/cart") || // Allow guest cart access
    pathname === "/" ||
    pathname.startsWith("/catalog") ||
    pathname.startsWith("/product/") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/onboarding")
  ) {
    return NextResponse.next();
  }
  
  // OAuth callback - allow without auth, it handles auth internally
  if (pathname === "/api/zoho/oauth/callback") {
    return NextResponse.next();
  }
  
  // Cron jobs - allow without auth, they authenticate via Bearer token
  if (pathname.startsWith("/api/cron/")) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user has completed onboarding (has at least one organization)
  // Skip this check if coming from onboarding page to prevent redirect loop
  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/account"))) {
    const hasOrgs = req.auth.user?.memberships && req.auth.user.memberships.length > 0;
    
    if (!hasOrgs) {
      // Redirect to onboarding if user hasn't created an organization
      const onboardingUrl = new URL("/onboarding", req.url);
      // Add email parameter if available from auth context
      if (req.auth.user?.email) {
        onboardingUrl.searchParams.set("email", req.auth.user.email);
      }
      return NextResponse.redirect(onboardingUrl);
    }
  }

  // API routes - add org context to headers for multi-tenant
  if (pathname.startsWith("/api/")) {
    const orgId = req.headers.get("x-org-id") || req.nextUrl.searchParams.get("orgId");
    
    if (orgId) {
      // Validate that user has access to this org
      const membership = req.auth.user?.memberships.find(
        (m) => m.orgId === orgId
      );

      if (!membership) {
        return NextResponse.json(
          { error: "Access denied to organization" },
          { status: 403 }
        );
      }

      // Add org context to request headers
      const response = NextResponse.next();
      response.headers.set("x-user-id", req.auth.user.id);
      response.headers.set("x-org-id", orgId);
      response.headers.set("x-user-role", membership.role);
      return response;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

