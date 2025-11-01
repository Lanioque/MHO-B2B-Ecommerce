/**
 * Organization Repository Implementation
 */

import type { Organization, Membership, PrismaClient } from '@/lib/prisma-types';
import { prisma } from '@/lib/prisma';
import {
  IOrganizationRepository,
  CreateOrganizationData,
  CreateMembershipData,
} from '@/lib/domain/interfaces/IOrganizationRepository';

export class OrganizationRepository implements IOrganizationRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findById(id: string): Promise<Organization | null> {
    return this.db.organization.findUnique({
      where: { id },
    });
  }

  async create(data: CreateOrganizationData): Promise<Organization> {
    return this.db.organization.create({
      data: {
        name: data.name,
        vatNumber: data.vatNumber,
        employeeCount: data.employeeCount,
        supportedDietTypes: data.supportedDietTypes || [],
      },
    });
  }

  async createMembership(data: CreateMembershipData): Promise<Membership> {
    return this.db.membership.create({
      data: {
        ...data,
        role: data.role as any, // Prisma expects Role enum, but interface uses string
      },
    });
  }

  async findMembershipsByUserId(
    userId: string
  ): Promise<Array<Membership & { org: Organization }>> {
    return this.db.membership.findMany({
      where: { userId },
      include: {
        org: true,
      },
    });
  }

  async findMembership(userId: string, orgId?: string): Promise<Membership | null> {
    // Since userId is now unique, we can find by userId directly
    if (orgId) {
      // If orgId is provided, verify it matches
      const membership = await this.db.membership.findUnique({
        where: { userId },
      });
      return membership && membership.orgId === orgId ? membership : null;
    }
    // Otherwise just find by userId (user can only have one membership)
    return this.db.membership.findUnique({
      where: { userId },
    });
  }

  async update(id: string, data: Partial<CreateOrganizationData>): Promise<Organization> {
    return this.db.organization.update({
      where: { id },
      data: {
        name: data.name,
        vatNumber: data.vatNumber,
        employeeCount: data.employeeCount,
        supportedDietTypes: data.supportedDietTypes,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.organization.delete({
      where: { id },
    });
  }
}

// Singleton instance
let organizationRepositoryInstance: OrganizationRepository | null = null;

export function getOrganizationRepository(): OrganizationRepository {
  if (!organizationRepositoryInstance) {
    organizationRepositoryInstance = new OrganizationRepository();
  }
  return organizationRepositoryInstance;
}


