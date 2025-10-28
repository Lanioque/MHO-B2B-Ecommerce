/**
 * Batch Processor Utility
 * Generic batch processing for bulk operations
 */

import { BATCH_PROCESSING } from '@/lib/config/constants';

export interface BatchProcessorOptions<T> {
  batchSize?: number;
  maxConcurrent?: number;
  onProgress?: (processed: number, total: number, errors: number) => void;
  onBatchComplete?: (batchNumber: number, succeeded: number, failed: number) => void;
}

export interface BatchResult<T> {
  succeeded: T[];
  failed: Array<{ item: T; error: Error }>;
  totalProcessed: number;
  totalErrors: number;
}

export class BatchProcessor<T> {
  private batchSize: number;
  private maxConcurrent: number;
  private onProgress?: (processed: number, total: number, errors: number) => void;
  private onBatchComplete?: (batchNumber: number, succeeded: number, failed: number) => void;

  constructor(options: BatchProcessorOptions<T> = {}) {
    this.batchSize = options.batchSize || BATCH_PROCESSING.DEFAULT_BATCH_SIZE;
    this.maxConcurrent = options.maxConcurrent || BATCH_PROCESSING.MAX_CONCURRENT_BATCHES;
    this.onProgress = options.onProgress;
    this.onBatchComplete = options.onBatchComplete;
  }

  /**
   * Process items in batches
   */
  async process(
    items: T[],
    processor: (item: T) => Promise<void>
  ): Promise<BatchResult<T>> {
    const succeeded: T[] = [];
    const failed: Array<{ item: T; error: Error }> = [];
    const total = items.length;

    // Split into batches
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }

    console.log(`[BatchProcessor] Processing ${total} items in ${batches.length} batches`);

    // Process batches with concurrency limit
    for (let i = 0; i < batches.length; i += this.maxConcurrent) {
      const batchGroup = batches.slice(i, i + this.maxConcurrent);
      
      await Promise.all(
        batchGroup.map(async (batch, batchIndex) => {
          const actualBatchNumber = i + batchIndex + 1;
          let batchSucceeded = 0;
          let batchFailed = 0;

          console.log(
            `[BatchProcessor] Processing batch ${actualBatchNumber}/${batches.length} (${batch.length} items)`
          );

          for (const item of batch) {
            try {
              await processor(item);
              succeeded.push(item);
              batchSucceeded++;
            } catch (error) {
              failed.push({ item, error: error as Error });
              batchFailed++;
            }

            if (this.onProgress) {
              this.onProgress(succeeded.length + failed.length, total, failed.length);
            }
          }

          if (this.onBatchComplete) {
            this.onBatchComplete(actualBatchNumber, batchSucceeded, batchFailed);
          }

          console.log(
            `[BatchProcessor] Batch ${actualBatchNumber} complete: ${batchSucceeded} succeeded, ${batchFailed} failed`
          );
        })
      );
    }

    console.log(
      `[BatchProcessor] All batches complete: ${succeeded.length} succeeded, ${failed.length} failed`
    );

    return {
      succeeded,
      failed,
      totalProcessed: succeeded.length + failed.length,
      totalErrors: failed.length,
    };
  }

  /**
   * Process items in batches with transaction support
   */
  async processWithTransaction<TxClient>(
    items: T[],
    processor: (items: T[], tx: TxClient) => Promise<void>,
    getTransaction: () => Promise<TxClient>,
    commitTransaction: (tx: TxClient) => Promise<void>,
    rollbackTransaction: (tx: TxClient) => Promise<void>
  ): Promise<BatchResult<T>> {
    const succeeded: T[] = [];
    const failed: Array<{ item: T; error: Error }> = [];
    const total = items.length;

    // Split into batches
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }

    console.log(
      `[BatchProcessor] Processing ${total} items in ${batches.length} batches with transactions`
    );

    // Process batches sequentially for transaction safety
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;

      console.log(
        `[BatchProcessor] Processing batch ${batchNumber}/${batches.length} (${batch.length} items)`
      );

      const tx = await getTransaction();

      try {
        await processor(batch, tx);
        await commitTransaction(tx);
        succeeded.push(...batch);
        
        if (this.onProgress) {
          this.onProgress(succeeded.length, total, failed.length);
        }

        if (this.onBatchComplete) {
          this.onBatchComplete(batchNumber, batch.length, 0);
        }

        console.log(`[BatchProcessor] Batch ${batchNumber} committed successfully`);
      } catch (error) {
        await rollbackTransaction(tx);
        
        // Mark all items in batch as failed
        batch.forEach(item => {
          failed.push({ item, error: error as Error });
        });

        if (this.onProgress) {
          this.onProgress(succeeded.length + failed.length, total, failed.length);
        }

        if (this.onBatchComplete) {
          this.onBatchComplete(batchNumber, 0, batch.length);
        }

        console.error(`[BatchProcessor] Batch ${batchNumber} failed and rolled back:`, error);
      }
    }

    console.log(
      `[BatchProcessor] All batches complete: ${succeeded.length} succeeded, ${failed.length} failed`
    );

    return {
      succeeded,
      failed,
      totalProcessed: succeeded.length + failed.length,
      totalErrors: failed.length,
    };
  }
}


