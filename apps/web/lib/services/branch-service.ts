/**
 * Branch Service
 * Business logic for branch operations with transaction support
 */

import { Branch, Address, PrismaClient } from '@prisma/client';
import { IUnitOfWork } from '@/lib/domain/interfaces/IUnitOfWork';
import { getUnitOfWork } from '@/lib/repositories/unit-of-work';

export interface CreateBranchData {
  orgId: string;
  name: string;
  billing: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  shipping: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export class BranchService {
  constructor(private readonly unitOfWork: IUnitOfWork) {}

  /**
   * Create branch with addresses atomically
   * Uses transaction to prevent orphaned addresses
   */
  async createBranch(
    data: CreateBranchData
  ): Promise<Branch & { billing: Address; shipping: Address }> {
    return this.unitOfWork.execute(async (tx) => {
      // Create addresses within transaction
      const billingAddress = await tx.address.create({
        data: data.billing,
      });

      const shippingAddress = await tx.address.create({
        data: data.shipping,
      });

      // Create branch within same transaction
      const branch = await tx.branch.create({
        data: {
          orgId: data.orgId,
          name: data.name,
          billingId: billingAddress.id,
          shippingId: shippingAddress.id,
        },
        include: {
          billing: true,
          shipping: true,
        },
      });

      return branch;
    });
  }

  /**
   * Get branches for organization
   */
  async getBranchesByOrgId(
    orgId: string
  ): Promise<Array<Branch & { billing: Address; shipping: Address }>> {
    const client = this.unitOfWork.getClient();
    return client.branch.findMany({
      where: { orgId },
      include: {
        billing: true,
        shipping: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get branch by ID
   */
  async getBranchById(
    branchId: string
  ): Promise<(Branch & { billing: Address; shipping: Address }) | null> {
    const client = this.unitOfWork.getClient();
    return client.branch.findUnique({
      where: { id: branchId },
      include: {
        billing: true,
        shipping: true,
      },
    });
  }

  /**
   * Update branch with addresses atomically
   * Uses transaction to ensure consistency
   */
  async updateBranch(
    branchId: string,
    data: Partial<CreateBranchData>
  ): Promise<Branch & { billing: Address; shipping: Address }> {
    return this.unitOfWork.execute(async (tx) => {
      // Get existing branch
      const existingBranch = await tx.branch.findUnique({
        where: { id: branchId },
        include: { billing: true, shipping: true },
      });

      if (!existingBranch) {
        throw new Error('Branch not found');
      }

      // Update name if provided
      if (data.name) {
        await tx.branch.update({
          where: { id: branchId },
          data: { name: data.name },
        });
      }

      // Update billing address if provided
      if (data.billing) {
        await tx.address.update({
          where: { id: existingBranch.billingId },
          data: data.billing,
        });
      }

      // Update shipping address if provided
      if (data.shipping) {
        await tx.address.update({
          where: { id: existingBranch.shippingId },
          data: data.shipping,
        });
      }

      // Return updated branch
      return tx.branch.findUnique({
        where: { id: branchId },
        include: {
          billing: true,
          shipping: true,
        },
      }) as Promise<Branch & { billing: Address; shipping: Address }>;
    });
  }

  /**
   * Delete branch and its addresses atomically
   * Uses transaction to prevent orphaned addresses
   */
  async deleteBranch(branchId: string): Promise<void> {
    return this.unitOfWork.execute(async (tx) => {
      // Get branch with addresses
      const branch = await tx.branch.findUnique({
        where: { id: branchId },
        include: {
          billing: true,
          shipping: true,
        },
      });

      if (!branch) {
        throw new Error('Branch not found');
      }

      // Delete branch (cascade will handle relations)
      await tx.branch.delete({
        where: { id: branchId },
      });

      // Delete associated addresses
      await tx.address.deleteMany({
        where: {
          id: {
            in: [branch.billingId, branch.shippingId],
          },
        },
      });
    });
  }
}

// Factory function for dependency injection
export function createBranchService(unitOfWork?: IUnitOfWork): BranchService {
  return new BranchService(unitOfWork || getUnitOfWork());
}


