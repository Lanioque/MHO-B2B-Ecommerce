/**
 * GET /api/products/categories
 * Get all distinct product categories for visible products
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/middleware/error-handler';

async function getCategoriesHandler(req: NextRequest) {
  // Get all products with their categories
  const products = await prisma.product.findMany({
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
  });

  // Count products per category
  const categoryCounts = new Map<string, number>();
  products.forEach((product) => {
    if (product.categoryName) {
      const count = categoryCounts.get(product.categoryName) || 0;
      categoryCounts.set(product.categoryName, count + 1);
    }
  });

  // Convert to array and sort by count (descending), then alphabetically
  const categoriesWithCounts = Array.from(categoryCounts.entries())
    .map(([categoryName, count]) => ({
      name: categoryName,
      count,
    }))
    .sort((a, b) => {
      // First sort by count (descending)
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });

  const response = NextResponse.json({ 
    categories: categoriesWithCounts.map(c => c.name),
    categoriesWithCounts 
  });
  
  // Add cache headers to reduce redundant requests
  // Cache for 5 minutes
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  
  return response;
}

export const GET = withErrorHandler(getCategoriesHandler);

