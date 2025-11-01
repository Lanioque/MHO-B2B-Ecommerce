/**
 * Data Transfer Object Mappers
 * Convert between domain models and DTOs
 */

import { Product } from '@prisma/client';
import { ProductResponseDto } from './ProductDto';
import { CartResponseDto, CartItemResponseDto } from './CartDto';
import { CartWithItems } from '@/lib/domain/interfaces/ICartRepository';

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

export class CartMapper {
  static toItemResponseDto(item: CartWithItems['items'][0]): CartItemResponseDto {
    return {
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      productImage: item.product.imageName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      subtotalCents: item.quantity * item.unitPriceCents,
    };
  }

  static toResponseDto(cart: CartWithItems): CartResponseDto {
    const items = cart.items.map(this.toItemResponseDto);
    const subtotalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cart.id,
      branchId: cart.branchId,
      items,
      subtotalCents,
      itemCount,
      currency: cart.currency,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}


