import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user;

  // Log authentication status for debugging
  console.log('[Proxy]', {
    pathname,
    isAuthenticated,
    hasAuth: !!req.auth,
    userId: req.auth?.user?.id,
  });

  // Redirect authenticated users away from auth pages (except onboarding if they don't have orgs)
  if (isAuthenticated && pathname.startsWith('/login')) {
    console.log('[Proxy] Redirecting authenticated user to dashboard from:', pathname);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  if (isAuthenticated && pathname.startsWith('/register')) {
    // Check if user has organizations
    const hasOrgs = req.auth?.user?.memberships && req.auth.user.memberships.length > 0;
    if (hasOrgs) {
      console.log('[Proxy] Redirecting authenticated user to dashboard from:', pathname);
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // Allow authenticated users without orgs to register (edge case)
  }
  
  // Allow authenticated users without organizations to access onboarding
  if (isAuthenticated && pathname.startsWith('/onboarding')) {
    const hasOrgs = req.auth?.user?.memberships && req.auth.user.memberships.length > 0;
    if (hasOrgs) {
      // If they have orgs, redirect to dashboard
      console.log('[Proxy] Redirecting user with orgs from onboarding to dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // If no orgs, allow them to stay on onboarding
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
  // For API routes, return JSON error instead of redirect
  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    // Redirect to home page instead of login for non-API routes
    return NextResponse.redirect(new URL("/", req.url));
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
  // Note: We allow the request to pass through even if membership isn't in session
  // The individual API routes will handle authorization with their own fallback logic
  if (pathname.startsWith("/api/")) {
    const orgId = req.headers.get("x-org-id") || req.nextUrl.searchParams.get("orgId");
    
    if (orgId && req.auth?.user?.id) {
      // Try to get membership from session first
      let membership = req.auth.user?.memberships?.find(
        (m) => m.orgId === orgId
      );

      // If no membership in session, try database (but don't block if it fails)
      // The API route will handle the final authorization check
      if (!membership) {
        try {
          const { prisma } = await import('@/lib/prisma');
          const dbMembership = await prisma.membership.findFirst({
            where: {
              userId: req.auth.user.id,
              orgId: orgId,
            },
            select: {
              id: true,
              orgId: true,
              role: true,
            },
          });
          
          if (dbMembership) {
            // Convert database membership to match session membership structure
            membership = {
              id: dbMembership.id,
              orgId: dbMembership.orgId,
              role: dbMembership.role,
            };
          }
        } catch (error) {
          // If database check fails, continue anyway - let the API route handle authorization
          console.warn('[Proxy] Could not verify membership in middleware, API route will handle:', error);
        }
      }

      // Add org context to request headers if we found membership
      // If not found, still pass through - let the API route decide
      if (membership) {
      const response = NextResponse.next();
      response.headers.set("x-user-id", req.auth.user.id);
      response.headers.set("x-org-id", orgId);
      response.headers.set("x-user-role", membership.role);
      return response;
      }
      // If no membership found, still allow request through - API route will handle authorization
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

