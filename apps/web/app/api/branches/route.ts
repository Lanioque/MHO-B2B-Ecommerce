import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, Role } from "@/lib/auth-helpers";
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

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const validated = createBranchSchema.parse(body);

    // Verify user has access to org
    await requireRole(validated.orgId, Role.ADMIN);

    // Create addresses
    const billingAddress = await prisma.address.create({
      data: validated.billing,
    });

    const shippingAddress = await prisma.address.create({
      data: validated.shipping,
    });

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        orgId: validated.orgId,
        name: validated.name,
        billingId: billingAddress.id,
        shippingId: shippingAddress.id,
      },
      include: {
        billing: true,
        shipping: true,
      },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if ((error as any).statusCode) {
      return NextResponse.json(
        { error: (error as any).message },
        { status: (error as any).statusCode }
      );
    }

    console.error("Branch creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const orgId = req.nextUrl.searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    // Verify access
    await requireRole(orgId, Role.CUSTOMER);

    const branches = await prisma.branch.findMany({
      where: { orgId },
      include: {
        billing: true,
        shipping: true,
      },
    });

    return NextResponse.json({ branches });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

