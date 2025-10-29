/**
 * Zoho Client Interface
 * Defines the contract for Zoho API interactions
 */

import { ZohoRegion } from '@/lib/config';

export interface ZohoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export interface ZohoOrganization {
  organization_id: string;
  name: string;
  contact_name: string;
  currency_code: string;
  currency_symbol: string;
  currency_name: string;
  price_precision: number;
}

export interface ZohoItem {
  item_id: string;
  item_name: string;
  name: string;
  sku: string;
  description?: string;
  rate: number;
  purchase_rate?: number;
  quantity?: number;
  stock_on_hand: number;
  
  // Identifiers
  ean?: string;
  upc?: string;
  isbn?: string;
  part_number?: string;
  
  // Brand and category
  brand?: string;
  manufacturer?: string;
  category_id?: string;
  category_name?: string;
  unit?: string;
  
  // Status
  status?: string;
  source?: string;
  item_type?: string;
  product_type?: string;
  
  // Tax
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number;
  is_taxable?: boolean;
  tax_exemption_id?: string;
  tax_exemption_code?: string;
  tax_category_code?: string;
  tax_category_name?: string;
  
  // Inventory flags
  track_inventory?: boolean;
  can_be_sold?: boolean;
  can_be_purchased?: boolean;
  is_returnable?: boolean;
  track_batch_number?: boolean;
  is_storage_location_enabled?: boolean;
  
  // Zoho CRM
  is_linked_with_zohocrm?: boolean;
  zcrm_product_id?: string;
  purchase_account_id?: string;
  purchase_account_name?: string;
  account_id?: string;
  account_name?: string;
  purchase_description?: string;
  
  // Storefront
  show_in_storefront?: boolean;
  
  // Physical attributes
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  weight_unit?: string;
  dimension_unit?: string;
  
  // Product flags
  is_combo_product?: boolean;
  has_attachment?: boolean;
  
  // Image
  image_name?: string;
  image_type?: string;
  image_document_id?: string;
  
  // Tags
  tags?: string[];
  
  // Timestamps
  created_time?: string;
  last_modified_time?: string;
}

export interface ZohoContact {
  contact_id?: string;
  contact_name: string;
  company_name?: string;
  customer_name?: string;
  email?: string;
  phone?: string;
  billing_address?: {
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  shipping_address?: {
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  contact_type?: 'customer' | 'vendor';
  currency_code?: string;
}

export interface ZohoLineItem {
  item_id?: string;
  sku?: string;
  name?: string;
  description?: string;
  quantity: number;
  rate: number;
  unit?: string;
  tax_id?: string;
  item_total?: number;
}

export interface ZohoSalesOrder {
  salesorder_id?: string;
  salesorder_number?: string;
  customer_id: string;
  customer_name?: string;
  reference_number?: string;
  date?: string;
  delivery_date?: string;
  line_items: ZohoLineItem[];
  subtotal?: number;
  tax_total?: number;
  total?: number;
  currency_code?: string;
  notes?: string;
  terms?: string;
}

export interface ZohoInvoice {
  invoice_id?: string;
  invoice_number?: string;
  salesorder_id?: string;
  customer_id: string;
  customer_name?: string;
  reference_number?: string;
  date?: string;
  due_date?: string;
  payment_terms?: number;
  line_items: ZohoLineItem[];
  subtotal?: number;
  tax_total?: number;
  total?: number;
  balance?: number;
  currency_code?: string;
  status?: string;
  pdf_url?: string;
  invoice_url?: string;
}

export interface IZohoClient {
  /**
   * Exchange authorization code for tokens
   */
  exchangeCode(code: string, region?: ZohoRegion): Promise<ZohoTokenResponse>;

  /**
   * Refresh access token
   */
  refreshToken(refreshToken: string, region?: ZohoRegion): Promise<ZohoTokenResponse>;

  /**
   * Get valid access token (refresh if expired)
   */
  getValidAccessToken(orgId?: string): Promise<string>;

  /**
   * Fetch organizations for authenticated user
   */
  fetchOrganizations(orgId: string): Promise<ZohoOrganization[]>;

  /**
   * Fetch items from Zoho Inventory with pagination
   */
  fetchItems(orgId?: string, zohoOrganizationId?: string): Promise<ZohoItem[]>;

  /**
   * Build OAuth authorization URL
   */
  getAuthUrl(orgId: string): string;

  /**
   * Create a contact (customer) in Zoho Books
   */
  createContact(orgId: string, contactData: ZohoContact): Promise<ZohoContact>;

  /**
   * Get contact by email
   */
  getContactByEmail(orgId: string, email: string): Promise<ZohoContact | null>;

  /**
   * Create a sales order in Zoho Books
   */
  createSalesOrder(orgId: string, salesOrderData: ZohoSalesOrder): Promise<ZohoSalesOrder>;

  /**
   * Create an invoice in Zoho Books
   */
  createInvoice(orgId: string, invoiceData: Partial<ZohoInvoice>): Promise<ZohoInvoice>;

  /**
   * Get invoice details including PDF URL
   */
  getInvoice(orgId: string, invoiceId: string): Promise<ZohoInvoice>;

  /**
   * Mark invoice as sent in Zoho Books
   */
  sendInvoice(orgId: string, invoiceId: string): Promise<ZohoInvoice>;
}


