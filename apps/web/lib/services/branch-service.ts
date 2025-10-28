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
    });
  }
}

// Factory function for dependency injection
export function createBranchService(unitOfWork?: IUnitOfWork): BranchService {
  return new BranchService(unitOfWork || getUnitOfWork());
}


