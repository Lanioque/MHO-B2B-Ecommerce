import { NextRequest, NextResponse } from "next/server";
import { createProductService } from "@/lib/services/product-service";
import { withErrorHandler } from "@/lib/middleware/error-handler";
import { validateRequestBody, parsePaginationParams } from "@/lib/middleware/validation";
import { CreateProductSchema } from "@/lib/dto/ProductDto";
import { ProductMapper } from "@/lib/dto/mapper";

/**
 * GET /api/products
 * List products with pagination and filters
 * Thin controller - delegates to ProductService
 */
async function getProductsHandler(req: NextRequest) {
  const productService = createProductService();

  // Parse filters
  const isVisible = req.nextUrl.searchParams.get("isVisible");
  const filter = {
    isVisible: isVisible !== null ? isVisible === "true" : undefined,
    status: 'active',
    hasImage: true,
  };

  // Parse pagination
  const pagination = parsePaginationParams(req);

  // Get products
  const result = await productService.getProducts(filter, pagination);

  return NextResponse.json({
    products: ProductMapper.toResponseDtoList(result.items),
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}

/**
 * POST /api/products
 * Create a new product
 * Thin controller - delegates to ProductService
 */
async function createProductHandler(req: NextRequest) {
  const productService = createProductService();

  // Validate request body
  const validated = await validateRequestBody(req, CreateProductSchema);

  // Create product
  const product = await productService.createProduct(validated);

  return NextResponse.json(
    { product: ProductMapper.toResponseDto(product) },
    { status: 201 }
  );
}

export const GET = withErrorHandler(getProductsHandler);
export const POST = withErrorHandler(createProductHandler);

