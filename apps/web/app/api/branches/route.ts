import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, Role } from "@/lib/auth-helpers";
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
});

/**
 * POST /api/branches
 * Create branch with addresses atomically
 * Thin controller - delegates to BranchService with transaction support
 */
async function createBranchHandler(req: NextRequest) {
  await requireAuth();
  const branchService = createBranchService();

  // Validate request body
  const validated = await validateRequestBody(req, createBranchSchema);

  // Verify user has access to org
  await requireRole(validated.orgId, Role.ADMIN);

  // Create branch (atomic operation with transaction)
  const branch = await branchService.createBranch(validated);

  return NextResponse.json({ branch }, { status: 201 });
}

/**
 * GET /api/branches
 * List branches for organization
 * Thin controller - delegates to BranchService
 */
async function getBranchesHandler(req: NextRequest) {
  await requireAuth();
  const branchService = createBranchService();

  const orgId = req.nextUrl.searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  // Verify access
  await requireRole(orgId, Role.CUSTOMER);

  // Get branches
  const branches = await branchService.getBranchesByOrgId(orgId);

  return NextResponse.json({ branches });
}

export const POST = withErrorHandler(createBranchHandler);
export const GET = withErrorHandler(getBranchesHandler);

