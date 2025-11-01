import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, Role } from "@/lib/auth-helpers";
import { withErrorHandler } from "@/lib/middleware/error-handler";
import { prisma } from "@/lib/prisma";
import { parseISO } from "date-fns";

/**
 * GET /api/invoices
 * List invoices for organization with filters and pagination
 */
async function getInvoicesHandler(req: NextRequest) {
  await requireAuth();

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");
  const branchId = searchParams.get("branchId");
  const status = searchParams.get("status");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  // Verify access
  await requireRole(orgId, Role.CUSTOMER);

  // Build where clause
  const where: any = {
    orgId,
  };

  if (branchId) {
    where.order = {
      branchId,
    };
  }

  if (status && status !== "all") {
    where.status = status;
  }

  // Add date range filtering
  if (startDateParam || endDateParam) {
    where.createdAt = {};
    if (startDateParam) {
      where.createdAt.gte = parseISO(startDateParam);
    }
    if (endDateParam) {
      const endDate = parseISO(endDateParam);
      // Include the entire end date (set to end of day)
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  // Get total count
  const total = await prisma.invoice.count({ where });

  // Get invoices with pagination
  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      order: {
        select: {
          id: true,
          number: true,
          totalCents: true,
          currency: true,
          branchId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Fetch branches for orders that have branchId
  const branchIds = [...new Set(
    invoices
      .map((invoice: typeof invoices[number]) => invoice.order?.branchId)
      .filter(Boolean)
  )] as string[];

  const branches = branchIds.length > 0
    ? await prisma.branch.findMany({
        where: { id: { in: branchIds } },
        select: {
          id: true,
          name: true,
        },
      })
    : [];

  // Map branches to orders
  const invoicesWithBranches = invoices.map((invoice) => {
    const invoiceData: any = { ...invoice };
    if (invoice.order?.branchId) {
      const branch = branches.find((b) => b.id === invoice.order.branchId);
      if (branch) {
        invoiceData.order = {
          ...invoice.order,
          branch,
        };
      }
    }
    return invoiceData;
  });

  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    data: invoicesWithBranches,
    total,
    page,
    pageSize,
    totalPages,
  });
}

export const GET = withErrorHandler(getInvoicesHandler);

