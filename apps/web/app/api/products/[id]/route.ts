import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, Role } from "@/lib/auth-helpers";
import { z } from "zod";
import { NotFoundError } from "@/lib/errors";

const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().positive().optional(),
  currency: z.string().optional(),
  vatRate: z.number().min(0).max(1).optional(),
  zohoItemId: z.string().optional().nullable(),
  isVisible: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Get orgId from query params (products are global, so we check user's org access)
    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify access - user must be ADMIN in the organization
    await requireRole(orgId, Role.ADMIN);

    const body = await req.json();
    const validated = updateProductSchema.parse(body);

    const updated = await prisma.product.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    if ((error as any).statusCode) {
      return NextResponse.json(
        { error: (error as any).message },
        { status: (error as any).statusCode }
      );
    }

    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Get orgId from query params (products are global, so we check user's org access)
    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify access - user must be ADMIN in the organization
    await requireRole(orgId, Role.ADMIN);

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

