/**
 * Zoho Sync Service
 * Consolidates ALL product sync logic - eliminates duplication
 * Single responsibility: sync products from Zoho to database
 */

import { IZohoClient } from '@/lib/domain/interfaces/IZohoClient';
import { IProductRepository } from '@/lib/domain/interfaces/IProductRepository';
import { getZohoClient } from '@/lib/clients/zoho-client';
import { getProductRepository } from '@/lib/repositories/product-repository';
import { BatchProcessor } from '@/lib/utils/batching/batch-processor';
import { ZOHO_CONSTANTS } from '@/lib/config/constants';
import { mapZohoItemToProduct } from '@/lib/dto/ZohoItemDto';

export interface SyncProductsOptions {
  orgId?: string;
  zohoOrgId?: string;
  batchSize?: number;
  onProgress?: (synced: number, errors: number, total: number) => void;
}

export interface SyncProductsResult {
  success: boolean;
  synced: number;
  errors: number;
  totalFetched: number;
}

export class ZohoSyncService {
  constructor(
    private readonly zohoClient: IZohoClient,
    private readonly productRepository: IProductRepository
  ) {}

  /**
   * Sync products from Zoho to database
   * Uses batch processing for performance
   * Handles errors gracefully per item
   */
  async syncProductsFromZoho(options: SyncProductsOptions = {}): Promise<SyncProductsResult> {
    const { orgId, zohoOrgId, batchSize, onProgress } = options;

    console.log(`[ZohoSyncService] Starting product sync from Zoho for org: ${zohoOrgId || orgId}`);

    // Fetch all items from Zoho
    const items = await this.zohoClient.fetchItems(orgId, zohoOrgId);
    console.log(`[ZohoSyncService] Fetched ${items.length} items from Zoho`);

    if (items.length > 0) {
      console.log('[ZohoSyncService] Sample item (first):', JSON.stringify(items[0], null, 2));
    }

    // Use batch processor for efficient processing
    const batchProcessor = new BatchProcessor({
      batchSize: batchSize || ZOHO_CONSTANTS.DEFAULT_BATCH_SIZE,
      onProgress: onProgress
        ? (processed, total, errors) => onProgress(processed - errors, errors, total)
        : undefined,
      onBatchComplete: (batchNum, succeeded, failed) => {
        console.log(
          `[ZohoSyncService] Batch ${batchNum}: ${succeeded} succeeded, ${failed} failed`
        );
      },
    });

    // Process each item
    const result = await batchProcessor.process(items, async (item) => {
      const productData = mapZohoItemToProduct(item);
      const sku = productData.sku;

      await this.productRepository.upsertBySku(sku, productData, productData);
    });

    console.log(
      `[ZohoSyncService] Sync complete: ${result.succeeded.length} synced, ${result.failed.length} errors`
    );

    // Log errors if any
    if (result.failed.length > 0) {
      console.error(`[ZohoSyncService] Failed items:`, result.failed);
    }

    return {
      success: result.failed.length < items.length,
      synced: result.succeeded.length,
      errors: result.failed.length,
      totalFetched: items.length,
    };
  }
}

// Factory function for dependency injection
export function createZohoSyncService(
  zohoClient?: IZohoClient,
  productRepository?: IProductRepository
): ZohoSyncService {
  return new ZohoSyncService(
    zohoClient || getZohoClient(),
    productRepository || getProductRepository()
  );
}


