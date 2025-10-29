/**
 * Order Service
 * Business logic for order operations
 */

import {
  IOrderRepository,
  OrderWithItems,
  CreateOrderData,
} from '@/lib/domain/interfaces/IOrderRepository';
import { ICartRepository } from '@/lib/domain/interfaces/ICartRepository';
import { getOrderRepository } from '@/lib/repositories/order-repository';
import { getCartRepository } from '@/lib/repositories/cart-repository';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { getUnitOfWork } from '@/lib/repositories/unit-of-work';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export class OrderService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly cartRepository: ICartRepository
  ) {}

  /**
   * Create order from cart
   */
  async createOrderFromCart(cartId: string, branchId?: string): Promise<OrderWithItems> {
    // Fetch cart with items
    const cart = await this.cartRepository.findById(cartId);
    
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    // Validate cart has items
    if (!cart.items || cart.items.length === 0) {
      throw new ValidationError('Cart is empty');
    }

    // Determine branchId to use
    const finalBranchId = cart.branchId || branchId;

    // Validate branch matches if both are provided
    if (branchId && cart.branchId && cart.branchId !== branchId) {
      throw new ValidationError('Branch does not match cart branch');
    }
    
    // Warn if no branch is set
    if (!finalBranchId) {
      console.warn('[OrderService] Order created without branch ID - Zoho sync will fail');
    }

    // Calculate totals
    let subtotalCents = 0;
    const orderItems = cart.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPriceCents;
      subtotalCents += itemSubtotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        subtotalCents: itemSubtotal,
      };
    });

    // Generate unique order number
    const orderNumber = this.generateOrderNumber();

    // Get or create customer record if user is authenticated
    let customerId: string | undefined;
    if (cart.userId) {
      const session = await auth();
      if (session?.user?.email) {
        // Find existing customer or create one
        let customer = await prisma.customer.findUnique({
          where: {
            orgId_email: {
              orgId: cart.orgId,
              email: session.user.email,
            },
          },
        });

        if (!customer) {
          // Create customer record from user
          customer = await prisma.customer.create({
            data: {
              orgId: cart.orgId,
              email: session.user.email,
              firstName: session.user.name || null,
            },
          });
        }

        customerId = customer.id;
      }
    }

    // Create order data
    const orderData: CreateOrderData = {
      orgId: cart.orgId,
      branchId: finalBranchId,
      customerId: customerId,
      number: orderNumber,
      totalCents: subtotalCents, // Add tax calculation later if needed
      currency: cart.currency,
      status: 'PENDING',
      billingId: undefined, // Will be set from branch if available
      shippingId: undefined, // Will be set from branch if available
      items: orderItems,
    };

    // Create order (cart clearing will be done separately for now)
    // TODO: Refactor cart repository to accept transaction client
    const order = await this.orderRepository.create(orderData);
    
    // Clear cart after order creation
    await this.cartRepository.clearCart(cartId);

    return order;
  }

  /**
   * Generate unique order number
   * Format: ORD-{timestamp}-{random}
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<OrderWithItems> {
    const order = await this.orderRepository.findById(orderId);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  /**
   * Get order by number
   */
  async getOrderByNumber(orderNumber: string): Promise<OrderWithItems> {
    const order = await this.orderRepository.findByNumber(orderNumber);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }
}

// Factory function
export function getOrderService(): OrderService {
  return new OrderService(
    getOrderRepository(),
    getCartRepository()
  );
}

