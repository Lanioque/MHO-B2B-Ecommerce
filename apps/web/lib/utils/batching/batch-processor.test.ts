import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchProcessor } from './batch-processor';

describe('BatchProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log and console.error to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default batch size and concurrency', () => {
      const processor = new BatchProcessor();

      expect(processor).toBeInstanceOf(BatchProcessor);
    });

    it('should use custom batch size', () => {
      const processor = new BatchProcessor({ batchSize: 10 });

      expect(processor).toBeInstanceOf(BatchProcessor);
    });

    it('should use custom max concurrent', () => {
      const processor = new BatchProcessor({ maxConcurrent: 5 });

      expect(processor).toBeInstanceOf(BatchProcessor);
    });

    it('should accept progress callback', () => {
      const onProgress = vi.fn();
      const processor = new BatchProcessor({ onProgress });

      expect(processor).toBeInstanceOf(BatchProcessor);
    });

    it('should accept batch complete callback', () => {
      const onBatchComplete = vi.fn();
      const processor = new BatchProcessor({ onBatchComplete });

      expect(processor).toBeInstanceOf(BatchProcessor);
    });
  });

  describe('process', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = new BatchProcessor({ batchSize: 2 });
      const processFn = vi.fn().mockResolvedValue(undefined);

      const result = await processor.process(items, processFn);

      expect(result.succeeded).toHaveLength(5);
      expect(result.failed).toHaveLength(0);
      expect(result.totalProcessed).toBe(5);
      expect(result.totalErrors).toBe(0);
      expect(processFn).toHaveBeenCalledTimes(5);
    });

    it('should handle processing errors', async () => {
      const items = [1, 2, 3];
      const processor = new BatchProcessor({ batchSize: 2 });
      const processFn = vi.fn().mockImplementation((item: number) => {
        if (item === 2) {
          throw new Error('Processing failed');
        }
      });

      const result = await processor.process(items, processFn);

      expect(result.succeeded).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.totalProcessed).toBe(3);
      expect(result.totalErrors).toBe(1);
      expect(result.failed[0].item).toBe(2);
      expect(result.failed[0].error.message).toBe('Processing failed');
    });

    it('should call onProgress callback', async () => {
      const items = [1, 2, 3];
      const onProgress = vi.fn();
      const processor = new BatchProcessor({ batchSize: 2, onProgress });
      const processFn = vi.fn().mockResolvedValue(undefined);

      await processor.process(items, processFn);

      expect(onProgress).toHaveBeenCalled();
      // Should be called at least once per item
      expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('should call onBatchComplete callback', async () => {
      const items = [1, 2, 3, 4];
      const onBatchComplete = vi.fn();
      const processor = new BatchProcessor({ batchSize: 2, onBatchComplete });
      const processFn = vi.fn().mockResolvedValue(undefined);

      await processor.process(items, processFn);

      // Should be called for each batch (2 batches for 4 items with batchSize 2)
      expect(onBatchComplete).toHaveBeenCalledTimes(2);
    });

    it('should handle empty items array', async () => {
      const processor = new BatchProcessor();
      const processFn = vi.fn();

      const result = await processor.process([], processFn);

      expect(result.succeeded).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
      expect(result.totalProcessed).toBe(0);
      expect(result.totalErrors).toBe(0);
      expect(processFn).not.toHaveBeenCalled();
    });

    it('should respect maxConcurrent limit', async () => {
      const items = Array.from({ length: 10 }, (_, i) => i);
      const processor = new BatchProcessor({ batchSize: 2, maxConcurrent: 1 });
      const processFn = vi.fn().mockResolvedValue(undefined);

      const result = await processor.process(items, processFn);

      expect(result.succeeded).toHaveLength(10);
      // With maxConcurrent: 1, batches should be processed sequentially
    });
  });

  describe('processWithTransaction', () => {
    it('should process items with transaction support', async () => {
      const items = [1, 2, 3];
      const processor = new BatchProcessor({ batchSize: 2 });
      
      const mockTx = { id: 'tx-1' };
      const getTransaction = vi.fn().mockResolvedValue(mockTx);
      const commitTransaction = vi.fn().mockResolvedValue(undefined);
      const rollbackTransaction = vi.fn().mockResolvedValue(undefined);
      const processFn = vi.fn().mockResolvedValue(undefined);

      const result = await processor.processWithTransaction(
        items,
        processFn,
        getTransaction,
        commitTransaction,
        rollbackTransaction
      );

      expect(result.succeeded).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(getTransaction).toHaveBeenCalled();
      expect(commitTransaction).toHaveBeenCalled();
      expect(rollbackTransaction).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const items = [1, 2, 3];
      const processor = new BatchProcessor({ batchSize: 2 });
      
      const mockTx = { id: 'tx-1' };
      const getTransaction = vi.fn().mockResolvedValue(mockTx);
      const commitTransaction = vi.fn().mockResolvedValue(undefined);
      const rollbackTransaction = vi.fn().mockResolvedValue(undefined);
      const processFn = vi.fn().mockRejectedValue(new Error('Batch failed'));

      const result = await processor.processWithTransaction(
        items,
        processFn,
        getTransaction,
        commitTransaction,
        rollbackTransaction
      );

      expect(result.succeeded).toHaveLength(0);
      expect(result.failed).toHaveLength(3); // All items in failed batch
      expect(rollbackTransaction).toHaveBeenCalled();
      expect(commitTransaction).not.toHaveBeenCalled();
    });

    it('should handle empty items array with transactions', async () => {
      const processor = new BatchProcessor();
      
      const getTransaction = vi.fn();
      const commitTransaction = vi.fn();
      const rollbackTransaction = vi.fn();
      const processFn = vi.fn();

      const result = await processor.processWithTransaction(
        [],
        processFn,
        getTransaction,
        commitTransaction,
        rollbackTransaction
      );

      expect(result.succeeded).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
      expect(getTransaction).not.toHaveBeenCalled();
    });

    it('should call callbacks during transaction processing', async () => {
      const items = [1, 2];
      const onProgress = vi.fn();
      const onBatchComplete = vi.fn();
      const processor = new BatchProcessor({ batchSize: 2, onProgress, onBatchComplete });
      
      const mockTx = { id: 'tx-1' };
      const getTransaction = vi.fn().mockResolvedValue(mockTx);
      const commitTransaction = vi.fn().mockResolvedValue(undefined);
      const rollbackTransaction = vi.fn().mockResolvedValue(undefined);
      const processFn = vi.fn().mockResolvedValue(undefined);

      await processor.processWithTransaction(
        items,
        processFn,
        getTransaction,
        commitTransaction,
        rollbackTransaction
      );

      expect(onProgress).toHaveBeenCalled();
      expect(onBatchComplete).toHaveBeenCalled();
    });

    it('should call onProgress and onBatchComplete when batch fails in transaction', async () => {
      const items = [1, 2];
      const onProgress = vi.fn();
      const onBatchComplete = vi.fn();
      const processor = new BatchProcessor({ batchSize: 2, onProgress, onBatchComplete });
      
      const mockTx = { id: 'tx-1' };
      const getTransaction = vi.fn().mockResolvedValue(mockTx);
      const commitTransaction = vi.fn().mockResolvedValue(undefined);
      const rollbackTransaction = vi.fn().mockResolvedValue(undefined);
      const processFn = vi.fn().mockRejectedValue(new Error('Transaction failed'));

      await processor.processWithTransaction(
        items,
        processFn,
        getTransaction,
        commitTransaction,
        rollbackTransaction
      );

      expect(onProgress).toHaveBeenCalled();
      expect(onBatchComplete).toHaveBeenCalledWith(1, 0, 2); // batchNumber, succeeded, failed
    });
  });
});

