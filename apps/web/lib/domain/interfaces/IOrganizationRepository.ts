/**
 * Organization Repository Interface
 */

import { Organization, Membership } from '@prisma/client';

export interface CreateOrganizationData {
  name: string;
  vatNumber?: string | null;
  employeeCount?: number | null;
  supportedDietTypes?: string[];
}

export interface CreateMembershipData {
  userId: string;
  orgId: string;
  role: string;
}

export interface IOrganizationRepository {
  /**
   * Find organization by ID
   */
  findById(id: string): Promise<Organization | null>;

  /**
   * Create organization
   */
  create(data: CreateOrganizationData): Promise<Organization>;

  /**
   * Create membership
   */
  createMembership(data: CreateMembershipData): Promise<Membership>;

  /**
   * Find memberships for user
   */
  findMembershipsByUserId(userId: string): Promise<Array<Membership & { org: Organization }>>;

  /**
   * Find membership by user (and optionally org)
   * Since userId is unique, orgId is optional
   */
  findMembership(userId: string, orgId?: string): Promise<Membership | null>;

  /**
   * Update organization
   */
  update(id: string, data: Partial<CreateOrganizationData>): Promise<Organization>;

  /**
   * Delete organization
   */
  delete(id: string): Promise<void>;
}


