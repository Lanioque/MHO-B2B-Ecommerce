import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createOrganizationService } from "@/lib/services/organization-service";
import { withErrorHandler } from "@/lib/middleware/error-handler";
import { validateRequestBody } from "@/lib/middleware/validation";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(1, { message: "Organization name is required" }),
  vatNumber: z.string().optional().or(z.literal("")),
  employeeCount: z.number().int().positive().optional().nullable(),
  supportedDietTypes: z.array(z.string()).optional(),
}).transform((data) => ({
  ...data,
  vatNumber: data.vatNumber && data.vatNumber.trim() !== "" ? data.vatNumber.trim() : undefined,
}));

/**
 * POST /api/orgs
 * Create organization with initial membership
 * Thin controller - delegates to OrganizationService
 */
async function createOrgHandler(req: NextRequest) {
  const session = await requireAuth();
  const organizationService = createOrganizationService();

  // Validate request body
  const validated = await validateRequestBody(req, createOrgSchema);

  // Create organization with membership (atomic operation)
  const { organization } = await organizationService.createOrganizationWithMembership({
    organization: {
      name: validated.name,
      vatNumber: validated.vatNumber,
      employeeCount: validated.employeeCount,
      supportedDietTypes: validated.supportedDietTypes || [],
    },
    userId: session.user.id,
    role: "OWNER",
  });

  return NextResponse.json({ org: organization }, { status: 201 });
}

/**
 * GET /api/orgs
 * Get user's organization (single organization per user)
 * Thin controller - delegates to OrganizationService
 */
async function getUserOrgsHandler(req: NextRequest) {
  const session = await requireAuth();
  const organizationService = createOrganizationService();

  // Get user's organization (single org per user)
  const membership = await organizationService.getUserOrganization(session.user.id);

  if (!membership) {
    return NextResponse.json({ orgs: [] });
  }

  const org = {
    ...membership.org,
    role: membership.role,
    membershipId: membership.id,
  };

  return NextResponse.json({ orgs: [org] });
}

export const POST = withErrorHandler(createOrgHandler);
export const GET = withErrorHandler(getUserOrgsHandler);

