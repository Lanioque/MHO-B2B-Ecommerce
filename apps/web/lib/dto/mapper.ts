/**
 * Data Transfer Object Mappers
 * Convert between domain models and DTOs
 */

import { Product } from '@prisma/client';
import { ProductResponseDto } from './ProductDto';

export class ProductMapper {
  static toResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      currency: product.currency,
      vatRate: product.vatRate,
      stock: product.stock,
      isVisible: product.isVisible,
      imageName: product.imageName,
      categoryName: product.categoryName,
      brand: product.brand,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  static toResponseDtoList(products: Product[]): ProductResponseDto[] {
    return products.map(this.toResponseDto);
  }
}


