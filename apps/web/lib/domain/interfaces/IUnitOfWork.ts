/**
 * Unit of Work Interface
 * Defines the contract for transaction management
 */

import { PrismaClient } from '@prisma/client';

export type TransactionCallback<T> = (tx: PrismaClient) => Promise<T>;

export interface IUnitOfWork {
  /**
   * Execute operations within a transaction
   * Automatically commits on success, rolls back on error
   */
  execute<T>(callback: TransactionCallback<T>): Promise<T>;

  /**
   * Get the underlying Prisma client
   * Use with caution - prefer execute() for transactional operations
   */
  getClient(): PrismaClient;
}


