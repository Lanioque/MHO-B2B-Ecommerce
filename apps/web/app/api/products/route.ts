import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth-helpers";
import { z, ZodError } from "zod";

const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  currency: z.string().default("USD"),
  vatRate: z.number().min(0).max(1).default(0),
  zohoItemId: z.string().optional(),
  isVisible: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    // Products are global, fetched from Zoho - no org filtering needed
    const where: any = {};

    // Filters
    const isVisible = req.nextUrl.searchParams.get("isVisible");
    if (isVisible !== null) {
      where.isVisible = isVisible === "true";
    }

    // Pagination
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(req.nextUrl.searchParams.get("pageSize") || "20");
    const skip = (page - 1) * pageSize;

    // Get total count
    const total = await prisma.product.count({ 
      where: {
        ...where,
        status: 'active',
        imageName: { not: null },
      },
    });

    // Get paginated products
    const products = await prisma.product.findMany({
      where: {
        ...where,
        status: 'active',
        imageName: { not: null },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createProductSchema.parse(body);

    // Check for duplicate SKU or slug
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: validated.sku },
          { slug: validated.slug },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Product with this SKU or slug already exists" },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: validated,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

