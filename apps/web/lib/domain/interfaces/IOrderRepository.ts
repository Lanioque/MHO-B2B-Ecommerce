/**
 * Order Repository Interface
 * Defines the contract for order data access
 */

import { Order, OrderItem, Prisma } from '@prisma/client';

export interface OrderWithItems extends Order {
  items: Array<OrderItem & { product: any }>;
  org?: any;
  customer?: any;
  branch?: any;
  billing?: any;
  shipping?: any;
  invoices?: Array<{
    id: string;
    number: string;
    pdfUrl: string | null;
    status: string;
    zohoInvoiceId: string | null;
  }>;
}

export interface CreateOrderData {
  orgId: string;
  branchId?: string;
  customerId?: string;
  number: string;
  totalCents: number;
  currency?: string;
  status?: string;
  billingId?: string;
  shippingId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
  }>;
}

export interface UpdateOrderData {
  status?: string;
  zohoSalesOrderId?: string;
  zohoInvoiceId?: string;
  paymentId?: string;
  telrTranRef?: string;
}

export interface OrderFilter {
  orgId?: string;
  branchId?: string;
  customerId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface IOrderRepository {
  /**
   * Find order by ID
   */
  findById(id: string): Promise<OrderWithItems | null>;

  /**
   * Find order by order number
   */
  findByNumber(number: string): Promise<OrderWithItems | null>;

  /**
   * Find order by Telr transaction reference
   */
  findByTelrTranRef(tranRef: string): Promise<OrderWithItems | null>;

  /**
   * Create a new order with items
   */
  create(data: CreateOrderData): Promise<OrderWithItems>;

  /**
   * Update order
   */
  update(id: string, data: UpdateOrderData): Promise<Order>;

  /**
   * Update Zoho IDs
   */
  updateZohoIds(id: string, zohoSalesOrderId?: string, zohoInvoiceId?: string): Promise<Order>;

  /**
   * Get orders with pagination
   */
  findMany(filter: OrderFilter, pagination: PaginationOptions): Promise<PaginatedResult<OrderWithItems>>;

  /**
   * Count orders matching filter
   */
  count(filter: OrderFilter): Promise<number>;
}

