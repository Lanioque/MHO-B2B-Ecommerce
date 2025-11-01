/**
 * Zoho Item DTOs
 * Data Transfer Objects for Zoho sync operations
 */

import { ZohoItem } from '@/lib/domain/interfaces/IZohoClient';
import { CreateProductData } from '@/lib/domain/interfaces/IProductRepository';
import { DATABASE_CONSTANTS } from '@/lib/config/constants';

export interface ZohoSyncRequestDto {
  orgId?: string;
  zohoOrgId?: string;
}

export interface ZohoSyncResponseDto {
  success: boolean;
  synced: number;
  errors: number;
  totalFetched: number;
}

/**
 * Map Zoho item to Product create/update data
 */
export function mapZohoItemToProduct(item: ZohoItem): CreateProductData & { [key: string]: any } {
  const sku = item.sku || item.item_id;
  const name = item.item_name;
  const priceCents = Math.round((item.rate || 0) * 100);
  const purchaseRate = item.purchase_rate || null;
  const stock = typeof item.stock_on_hand === 'number' ? item.stock_on_hand : 0;
  
  // Generate unique slug
  const baseSlug = (sku || name || item.item_id)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const slug = `${baseSlug}-${item.item_id}`.substring(0, DATABASE_CONSTANTS.MAX_SLUG_LENGTH);

  return {
    sku,
    slug,
    name,
    description: item.description || null,
    priceCents,
    purchaseRate,
    currency: 'AED',
    vatRate: 0,
    stock,
    
    // Additional identifiers
    ean: item.ean || null,
    upc: item.upc || null,
    isbn: item.isbn || null,
    partNumber: item.part_number || null,
    
    // Brand and manufacturer
    brand: item.brand || null,
    manufacturer: item.manufacturer || null,
    
    // Category
    categoryId: item.category_id || null,
    categoryName: item.category_name || null,
    unit: item.unit || 'unit',
    
    // Status
    status: item.status || 'active',
    source: item.source || null,
    itemType: item.item_type || null,
    productType: item.product_type || null,
    
    // Tax information
    taxId: item.tax_id || null,
    taxName: item.tax_name || null,
    taxPercentage: item.tax_percentage || null,
    isTaxable: item.is_taxable || false,
    taxExemptionId: item.tax_exemption_id || null,
    taxExemptionCode: item.tax_exemption_code || null,
    taxCategoryCode: item.tax_category_code || null,
    taxCategoryName: item.tax_category_name || null,
    
    // Inventory
    trackInventory: item.track_inventory ?? false,
    canBeSold: item.can_be_sold ?? true,
    canBePurchased: item.can_be_purchased ?? true,
    isReturnable: item.is_returnable ?? true,
    trackBatchNumber: item.track_batch_number || false,
    isStorageLocationEnabled: item.is_storage_location_enabled || false,
    
    // Zoho CRM
    isLinkedWithZohoCRM: item.is_linked_with_zohocrm || false,
    zcrmProductId: item.zcrm_product_id || null,
    purchaseAccountId: item.purchase_account_id || null,
    purchaseAccountName: item.purchase_account_name || null,
    accountId: item.account_id || null,
    accountName: item.account_name || null,
    purchaseDescription: item.purchase_description || null,
    
    // Storefront
    showInStorefront: item.show_in_storefront || false,
    
    // Physical attributes
    length: item.length || null,
    width: item.width || null,
    height: item.height || null,
    weight: item.weight || null,
    weightUnit: item.weight_unit || null,
    dimensionUnit: item.dimension_unit || null,
    
    // Product flags
    isComboProduct: item.is_combo_product || false,
    hasAttachment: item.has_attachment || false,
    
    // Image
    imageName: item.image_name || null,
    imageType: item.image_type || null,
    imageDocumentId: item.image_document_id || null,
    
    // Tags
    tags: item.tags || [],
    
    // Timestamps
    zohoItemId: item.item_id,
    zohoCreatedTime: item.created_time ? new Date(item.created_time) : null,
    zohoLastModifiedTime: item.last_modified_time ? new Date(item.last_modified_time) : null,
    lastStockSync: new Date(),
  };
}


