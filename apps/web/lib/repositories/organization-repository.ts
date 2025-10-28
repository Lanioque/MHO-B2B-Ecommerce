/**
 * Organization Repository Implementation
 */

import { Organization, Membership, PrismaClient } from '@prisma/client';
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
      data,
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

  async findMembership(userId: string, orgId: string): Promise<Membership | null> {
    return this.db.membership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
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


