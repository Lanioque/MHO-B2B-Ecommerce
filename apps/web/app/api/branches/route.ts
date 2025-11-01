import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, Role, roleHierarchy, SessionHelper } from "@/lib/auth-helpers";
import { PermissionError } from "@/lib/errors";
import { createBranchService } from "@/lib/services/branch-service";
import { withErrorHandler } from "@/lib/middleware/error-handler";
import { validateRequestBody } from "@/lib/middleware/validation";
import { z } from "zod";

const createBranchSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(1),
  billing: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  shipping: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  // Status and Description
  status: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  // Budget Information
  monthlyBudget: z.number().optional(),
  yearlyBudget: z.number().optional(),
  budgetCurrency: z.string().optional(),
  // Contact Information
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  // Manager Information
  managerName: z.string().optional(),
  managerEmail: z.string().email().optional().or(z.literal('')),
  managerPhone: z.string().optional(),
  // Operating Information
  operatingHours: z.string().optional(),
  capacity: z.number().optional(),
  employeeCount: z.number().optional(),
  // Financial Information
  costCenterCode: z.string().optional(),
  taxId: z.string().optional(),
});

/**
 * POST /api/branches
 * Create branch with addresses atomically
 * Thin controller - delegates to BranchService with transaction support
 */
async function createBranchHandler(req: NextRequest) {
  const session = await requireAuth();
  const branchService = createBranchService();

  // Validate request body
  const validated = await validateRequestBody(req, createBranchSchema);

  // Verify user has access to org
  // Allow OWNER role (which is higher than ADMIN) or ADMIN
  // During onboarding, the session might not have the new membership yet,
  // so we check the database directly if session check fails
  try {
    await requireRole(validated.orgId, Role.ADMIN);
  } catch (error) {
    // If session doesn't have membership, check database directly
    // This handles the case where org was just created and session hasn't refreshed
    const { prisma } = await import('@/lib/prisma');
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        orgId: validated.orgId,
      },
    });

    if (!membership) {
      throw new PermissionError('You don\'t have access to this organization');
    }

    // Check if role is sufficient (OWNER or ADMIN can create branches)
    const userRoleLevel = roleHierarchy[membership.role as Role] || 0;
    const requiredRoleLevel = roleHierarchy[Role.ADMIN];

    if (userRoleLevel < requiredRoleLevel) {
      throw new PermissionError(`This action requires ${Role.ADMIN} role or higher`);
    }
  }

  // Create branch then sync to Zoho as a customer
  const branch = await branchService.createBranch(validated);
  try {
    const { getBranchZohoSyncService } = await import('@/lib/services/branch-zoho-sync-service');
    await getBranchZohoSyncService().syncBranchToZohoContact(branch.id);
  } catch (e) {
    console.warn('[Branches API] Zoho sync after create failed', e);
  }

  return NextResponse.json({ branch }, { status: 201 });
}

/**
 * GET /api/branches
 * List branches for organization
 * Thin controller - delegates to BranchService
 */
async function getBranchesHandler(req: NextRequest) {
  const session = await requireAuth();
  const branchService = createBranchService();

  const orgId = req.nextUrl.searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  // Verify user has access to org
  // Check both session (primary) and database (fallback for fresh orgs)
  const sessionHelper = new SessionHelper(session);
  const sessionMembership = sessionHelper.getMembership(orgId);
  
  let hasAccess = false;
  let membership: { id: string; orgId: string; role: string } | null = null;
  
  if (sessionMembership) {
    // Membership found in session, verify role is sufficient
    // CUSTOMER is the minimum, any membership role is fine for GET requests
    const userRoleLevel = roleHierarchy[sessionMembership.role as Role] || 0;
    const requiredRoleLevel = roleHierarchy[Role.CUSTOMER];
    hasAccess = userRoleLevel >= requiredRoleLevel;
    if (hasAccess) {
      membership = sessionMembership;
    }
  }
  
  // If no membership in session or insufficient role, check database directly
  // This handles cases where org was just created and session hasn't refreshed yet
  if (!hasAccess) {
    try {
      const { prisma } = await import('@/lib/prisma');
      // Use findUnique by userId (since userId is unique in Membership)
      // Then verify the orgId matches
      const dbMembership = await prisma.membership.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          orgId: true,
          role: true,
        },
      });
      
      // Verify the membership exists and orgId matches
      if (dbMembership && dbMembership.orgId === orgId) {
        // Membership found in database with matching orgId, verify role
        const userRoleLevel = roleHierarchy[dbMembership.role as Role] || 0;
        const requiredRoleLevel = roleHierarchy[Role.CUSTOMER];
        hasAccess = userRoleLevel >= requiredRoleLevel;
        if (hasAccess) {
          membership = dbMembership;
        }
      }
      
      if (!hasAccess) {
        // Log detailed debugging info
        const sessionOrgIds = session.user.memberships?.map(m => m.orgId) || [];
        const sessionMembershipDetails = session.user.memberships?.map(m => ({ orgId: m.orgId, role: m.role })) || [];
        console.warn('[Branches API] No valid membership found', {
          userId: session.user.id,
          requestedOrgId: orgId,
          sessionMemberships: session.user.memberships?.length || 0,
          sessionOrgIds: sessionOrgIds,
          sessionMembershipDetails: sessionMembershipDetails,
          dbMembershipFound: !!dbMembership,
          dbMembershipOrgId: dbMembership?.orgId,
          orgIdMatches: dbMembership?.orgId === orgId,
        });
        
        // Check if the requested orgId exists in session but wasn't found by getMembership
        const requestedOrgInSession = session.user.memberships?.some(m => m.orgId === orgId);
        if (requestedOrgInSession) {
          // Session has the org but getMembership didn't find it - this shouldn't happen
          console.error('[Branches API] Session has membership for requested orgId but getMembership failed', {
            requestedOrgId: orgId,
            sessionMemberships: sessionMembershipDetails,
          });
        }
        
        throw new PermissionError('You don\'t have access to this organization');
      }
    } catch (error) {
      // If database query fails or membership not found, throw permission error
      if (error instanceof PermissionError) {
        throw error;
      }
      // Database query error - log and throw permission error
      console.error('[Branches API] Database query failed:', error);
      throw new PermissionError('You don\'t have access to this organization');
    }
  }

  // Get branches
  const branches = await branchService.getBranchesByOrgId(orgId);

  return NextResponse.json({ branches });
}

export const POST = withErrorHandler(createBranchHandler);
export const GET = withErrorHandler(getBranchesHandler);

