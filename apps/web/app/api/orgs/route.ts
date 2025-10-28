import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(1),
  vatNumber: z.string().optional(),
  employeeCount: z.number().int().positive().optional().nullable(),
  supportedDietTypes: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const validated = createOrgSchema.parse(body);

    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: validated.name,
        vatNumber: validated.vatNumber,
        employeeCount: validated.employeeCount,
        supportedDietTypes: validated.supportedDietTypes || [],
      },
    });

    // Create membership with OWNER role
    await prisma.membership.create({
      data: {
        userId: session.user.id,
        orgId: org.id,
        role: "OWNER",
      },
    });

    return NextResponse.json({ org }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Organization creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    // Get user's organizations
    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            vatNumber: true,
            createdAt: true,
          },
        },
      },
    });

    const orgs = memberships.map((m) => ({
      ...m.org,
      role: m.role,
      membershipId: m.id,
    }));

    return NextResponse.json({ orgs });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

