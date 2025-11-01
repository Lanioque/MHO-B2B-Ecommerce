/**
 * Branch Service
 * Business logic for branch operations with transaction support
 */

import type { Branch, Address, PrismaClient } from '@/lib/prisma-types';
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
  // Status and Description
  status?: string;
  description?: string;
  notes?: string;
  // Budget Information
  monthlyBudget?: number;
  yearlyBudget?: number;
  budgetCurrency?: string;
  // Contact Information
  phone?: string;
  email?: string;
  website?: string;
  // Manager Information
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  // Operating Information
  operatingHours?: string;
  capacity?: number;
  employeeCount?: number;
  // Financial Information
  costCenterCode?: string;
  taxId?: string;
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
          status: data.status || 'ACTIVE',
          description: data.description,
          notes: data.notes,
          monthlyBudget: data.monthlyBudget,
          yearlyBudget: data.yearlyBudget,
          budgetCurrency: data.budgetCurrency || 'AED',
          phone: data.phone,
          email: data.email,
          website: data.website,
          managerName: data.managerName,
          managerEmail: data.managerEmail,
          managerPhone: data.managerPhone,
          operatingHours: data.operatingHours,
          capacity: data.capacity,
          employeeCount: data.employeeCount,
          costCenterCode: data.costCenterCode,
          taxId: data.taxId,
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
   * Create branch and sync to Zoho asynchronously
   */
  async createBranchWithZohoSync(
    data: CreateBranchData
  ): Promise<Branch & { billing: Address; shipping: Address }> {
    const branch = await this.createBranch(data);

    // Sync to Zoho asynchronously (don't block response)
    this.syncBranchToZohoAsync(branch.id).catch((error) => {
      console.error(`[BranchService] Failed to sync branch ${branch.id} to Zoho:`, error);
    });

    return branch;
  }

  /**
   * Sync branch to Zoho (internal helper)
   */
  private async syncBranchToZohoAsync(branchId: string): Promise<void> {
    try {
      const { getBranchZohoSyncService } = await import('./branch-zoho-sync-service');
      const syncService = getBranchZohoSyncService();
      await syncService.syncBranchToZohoContact(branchId);
    } catch (error) {
      console.error(`[BranchService] Error syncing branch ${branchId} to Zoho:`, error);
    }
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

      // Build update data object
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.monthlyBudget !== undefined) updateData.monthlyBudget = data.monthlyBudget;
      if (data.yearlyBudget !== undefined) updateData.yearlyBudget = data.yearlyBudget;
      if (data.budgetCurrency !== undefined) updateData.budgetCurrency = data.budgetCurrency;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.website !== undefined) updateData.website = data.website;
      if (data.managerName !== undefined) updateData.managerName = data.managerName;
      if (data.managerEmail !== undefined) updateData.managerEmail = data.managerEmail;
      if (data.managerPhone !== undefined) updateData.managerPhone = data.managerPhone;
      if (data.operatingHours !== undefined) updateData.operatingHours = data.operatingHours;
      if (data.capacity !== undefined) updateData.capacity = data.capacity;
      if (data.employeeCount !== undefined) updateData.employeeCount = data.employeeCount;
      if (data.costCenterCode !== undefined) updateData.costCenterCode = data.costCenterCode;
      if (data.taxId !== undefined) updateData.taxId = data.taxId;

      // Update branch fields if any provided
      if (Object.keys(updateData).length > 0) {
        await tx.branch.update({
          where: { id: branchId },
          data: updateData,
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


