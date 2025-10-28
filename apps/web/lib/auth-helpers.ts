import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PermissionError, UnauthorizedError } from "@/lib/errors";

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
  const membership = session.user.memberships.find(
    (m) => m.orgId === orgId
  );

  if (!membership) {
    throw new PermissionError("You don't have access to this organization");
  }

  const userRole = roleHierarchy[membership.role as Role] || 0;
  const requiredRole = roleHierarchy[minimumRole];

  if (userRole < requiredRole) {
    throw new PermissionError(
      `This action requires ${minimumRole} role or higher`
    );
  }

  return { session, membership };
}

/**
 * Get organization context for multi-tenant queries
 */
export async function getOrgContext(orgId: string) {
  const { session } = await requireRole(orgId, Role.CUSTOMER);

  // Verify organization exists
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  return {
    orgId,
    userId: session.user.id,
    membership: session.user.memberships.find((m) => m.orgId === orgId),
    org,
  };
}

