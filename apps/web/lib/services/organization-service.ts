/**
 * Organization Service
 * Business logic for organization operations
 */

import {
  IOrganizationRepository,
  CreateOrganizationData,
} from '@/lib/domain/interfaces/IOrganizationRepository';
import { IUnitOfWork } from '@/lib/domain/interfaces/IUnitOfWork';
import type { Organization, Membership } from '@/lib/prisma-types';
import { NotFoundError } from '@/lib/errors';
import { getOrganizationRepository } from '@/lib/repositories/organization-repository';
import { getUnitOfWork } from '@/lib/repositories/unit-of-work';

export interface CreateOrganizationWithMembershipData {
  organization: CreateOrganizationData;
  userId: string;
  role: string;
}

export class OrganizationService {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async getOrganizationById(id: string): Promise<Organization> {
    const org = await this.organizationRepository.findById(id);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }
    return org;
  }

  /**
   * Get user's organization (single organization per user)
   */
  async getUserOrganization(
    userId: string
  ): Promise<(Membership & { org: Organization }) | null> {
    const memberships = await this.organizationRepository.findMembershipsByUserId(userId);
    return memberships[0] || null;
  }

  async getUserOrganizations(
    userId: string
  ): Promise<Array<Membership & { org: Organization }>> {
    return this.organizationRepository.findMembershipsByUserId(userId);
  }

  /**
   * Create organization with initial membership
   * Uses transaction to ensure atomicity
   * Enforces one organization per user constraint
   */
  async createOrganizationWithMembership(
    data: CreateOrganizationWithMembershipData
  ): Promise<{ organization: Organization; membership: Membership }> {
    return this.unitOfWork.execute(async (tx) => {
      const orgRepo = new (this.organizationRepository.constructor as any)(tx);

      // Check if user already has a membership
      const existingMembership = await orgRepo.findMembership(data.userId, undefined);
      if (existingMembership) {
        throw new Error('User already belongs to an organization. Each user can only have one organization.');
      }

      // Create organization
      const organization = await orgRepo.create(data.organization);

      // Create membership
      const membership = await orgRepo.createMembership({
        userId: data.userId,
        orgId: organization.id,
        role: data.role,
      });

      return { organization, membership };
    });
  }

  async updateOrganization(
    id: string,
    data: Partial<CreateOrganizationData>
  ): Promise<Organization> {
    // Ensure organization exists
    await this.getOrganizationById(id);

    return this.organizationRepository.update(id, data);
  }

  async deleteOrganization(id: string): Promise<void> {
    // Ensure organization exists
    await this.getOrganizationById(id);

    await this.organizationRepository.delete(id);
  }

  async checkUserMembership(userId: string, orgId: string): Promise<Membership | null> {
    return this.organizationRepository.findMembership(userId, orgId);
  }
}

// Factory function for dependency injection
export function createOrganizationService(
  organizationRepository?: IOrganizationRepository,
  unitOfWork?: IUnitOfWork
): OrganizationService {
  return new OrganizationService(
    organizationRepository || getOrganizationRepository(),
    unitOfWork || getUnitOfWork()
  );
}


