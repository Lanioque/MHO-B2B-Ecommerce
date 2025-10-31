/**
 * GET /api/products/categories
 * Get all distinct product categories for visible products
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/middleware/error-handler';

async function getCategoriesHandler(req: NextRequest) {
  // Get all distinct category names from visible, active products
  const categories = await prisma.product.findMany({
    where: {
      isVisible: true,
      status: 'active',
      categoryName: {
        not: null,
      },
    },
    select: {
      categoryName: true,
    },
    distinct: ['categoryName'],
    orderBy: {
      categoryName: 'asc',
    },
  });

  const categoryNames = categories
    .map((c) => c.categoryName)
    .filter((name): name is string => name !== null && name.trim() !== '');

  return NextResponse.json({ categories: categoryNames });
}

export const GET = withErrorHandler(getCategoriesHandler);

