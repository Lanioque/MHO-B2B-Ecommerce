/**
 * Unit of Work Pattern Implementation
 * Manages transactions across multiple repositories
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { IUnitOfWork, TransactionCallback } from '@/lib/domain/interfaces/IUnitOfWork';

export class UnitOfWork implements IUnitOfWork {
  constructor(private readonly client: PrismaClient = prisma) {}

  /**
   * Execute operations within a transaction
   * Automatically commits on success, rolls back on error
   */
  async execute<T>(callback: TransactionCallback<T>): Promise<T> {
    return await this.client.$transaction(async (tx: any) => {
      return await callback(tx as PrismaClient);
    });
  }

  /**
   * Get the underlying Prisma client
   */
  getClient(): PrismaClient {
    return this.client;
  }
}

// Singleton instance
let unitOfWorkInstance: UnitOfWork | null = null;

export function getUnitOfWork(): UnitOfWork {
  if (!unitOfWorkInstance) {
    unitOfWorkInstance = new UnitOfWork();
  }
  return unitOfWorkInstance;
}


