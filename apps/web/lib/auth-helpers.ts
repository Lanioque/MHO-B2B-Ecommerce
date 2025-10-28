import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PermissionError, UnauthorizedError, NotFoundError } from "@/lib/errors";
import { Session } from "next-auth";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  STAFF = "STAFF",
  CUSTOMER = "CUSTOMER",
}

export const roleHierarchy: Record<Role, number> = {
  [Role.OWNER]: 4,
  [Role.ADMIN]: 3,
  [Role.STAFF]: 2,
  [Role.CUSTOMER]: 1,
};

/**
 * Session helper methods to encapsulate data access
 * Fixes Law of Demeter violations
 */
export class SessionHelper {
  constructor(private readonly session: Session) {}

  getUserId(): string {
    return this.session.user.id;
  }

  getUserEmail(): string {
    return this.session.user.email;
  }

  getMembership(orgId?: string) {
    // If no orgId provided, return first membership
    if (!orgId) {
      return this.session.user.memberships[0] || null;
    }
    return this.session.user.memberships.find((m) => m.orgId === orgId);
  }

  getAllMemberships() {
    return this.session.user.memberships;
  }

  hasMembership(orgId: string): boolean {
    return this.session.user.memberships.some((m) => m.orgId === orgId);
  }

  hasRole(orgId: string, minimumRole: Role): boolean {
    const membership = this.getMembership(orgId);
    if (!membership) {
      return false;
    }

    const userRole = roleHierarchy[membership.role as Role] || 0;
    const requiredRole = roleHierarchy[minimumRole];

    return userRole >= requiredRole;
  }
}

/**
 * Get current session and ensure user is authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    throw new UnauthorizedError("You must be logged in");
  }

  return session;
}

/**
 * Require user to have a specific role in an organization
 */
export async function requireRole(
  orgId: string,
  minimumRole: Role = Role.CUSTOMER
) {
  const session = await requireAuth();
  const sessionHelper = new SessionHelper(session);

  const membership = sessionHelper.getMembership(orgId);

  if (!membership) {
    throw new PermissionError("You don't have access to this organization");
  }

  if (!sessionHelper.hasRole(orgId, minimumRole)) {
    throw new PermissionError(
      `This action requires ${minimumRole} role or higher`
    );
  }

  return { session, membership, sessionHelper };
}

/**
 * Get organization context for multi-tenant queries
 */
export async function getOrgContext(orgId: string) {
  const { session, membership, sessionHelper } = await requireRole(orgId, Role.CUSTOMER);

  // Verify organization exists
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    throw new NotFoundError("Organization not found");
  }

  return {
    orgId,
    userId: sessionHelper.getUserId(),
    membership,
    org,
  };
}

/**
 * Session ID management for guest users (carts, etc.)
 */
const SESSION_COOKIE_NAME = 'guest-session-id';
const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Get or create a session ID for guest users
 * Returns the session ID from cookie or creates a new one
 */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = uuidv4();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: '/',
    });
  }

  return sessionId;
}

/**
 * Get session ID if it exists (doesn't create new one)
 */
export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

/**
 * Clear session ID cookie
 */
export async function clearSessionId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

