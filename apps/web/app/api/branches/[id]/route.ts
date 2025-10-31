import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, Role } from "@/lib/auth-helpers";
import { createBranchService } from "@/lib/services/branch-service";
import { withErrorHandler } from "@/lib/middleware/error-handler";
import { validateRequestBody } from "@/lib/middleware/validation";
import { z } from "zod";

const updateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  billing: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
  shipping: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
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
 * GET /api/branches/[id]
 * Get a specific branch by ID
 */
async function getBranchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const branchService = createBranchService();
  const { id } = await params;

  const branch = await branchService.getBranchById(id);

  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  // Verify user has access to the branch's organization
  await requireRole(branch.orgId, Role.CUSTOMER);

  return NextResponse.json({ branch });
}

/**
 * PUT /api/branches/[id]
 * Update a specific branch
 */
async function updateBranchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const branchService = createBranchService();
  const { id } = await params;

  // Get existing branch to check orgId
  const existingBranch = await branchService.getBranchById(id);

  if (!existingBranch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  // Verify user has admin access to the organization
  await requireRole(existingBranch.orgId, Role.ADMIN);

  // Validate request body
  const validated = await validateRequestBody(req, updateBranchSchema);

  // Update branch
  const updatedBranch = await branchService.updateBranch(id, validated);
  // Sync changes to Zoho contact
  try {
    const { getBranchZohoSyncService } = await import('@/lib/services/branch-zoho-sync-service');
    await getBranchZohoSyncService().syncBranchToZohoContact(id);
  } catch (e) {
    console.warn('[Branches API] Zoho sync after update failed', e);
  }

  return NextResponse.json({ branch: updatedBranch });
}

/**
 * DELETE /api/branches/[id]
 * Delete a specific branch
 */
async function deleteBranchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const branchService = createBranchService();
  const { id } = await params;

  // Get existing branch to check orgId
  const existingBranch = await branchService.getBranchById(id);

  if (!existingBranch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  // Verify user has admin access to the organization
  await requireRole(existingBranch.orgId, Role.ADMIN);

  // Delete branch
  await branchService.deleteBranch(id);

  return NextResponse.json({ success: true, message: "Branch deleted successfully" });
}

export const GET = withErrorHandler(getBranchHandler);
export const PUT = withErrorHandler(updateBranchHandler);
export const DELETE = withErrorHandler(deleteBranchHandler);

