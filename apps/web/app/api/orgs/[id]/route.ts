import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext, requireRole, Role } from "@/lib/auth-helpers";
import { z } from "zod";
import { NotFoundError } from "@/lib/errors";

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  vatNumber: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { orgId } = await getOrgContext(id);

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        branches: {
          include: {
            billing: true,
            shipping: true,
          },
        },
        _count: {
          select: {
            customers: true,
            orders: true,
            branches: true,
            quotations: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundError("Organization not found");
    }

    return NextResponse.json({ org });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Error fetching organization:", error);
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
    const { membership } = await requireRole(id, Role.ADMIN);
    const body = await req.json();
    const validated = updateOrgSchema.parse(body);

    const org = await prisma.organization.update({
      where: { id },
      data: {
        ...validated,
      },
    });

    return NextResponse.json({ org });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating organization:", error);
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
    const { membership } = await requireRole(id, Role.OWNER);

    await prisma.organization.delete({
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

    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

