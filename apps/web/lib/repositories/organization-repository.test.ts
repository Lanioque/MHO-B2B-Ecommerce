import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationRepository, getOrganizationRepository } from './organization-repository';
import type { CreateOrganizationData, CreateMembershipData } from '@/lib/domain/interfaces/IOrganizationRepository';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    membership: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('OrganizationRepository', () => {
  let organizationRepository: OrganizationRepository;
  let mockPrisma: any;

  const mockOrganization = {
    id: 'org-1',
    name: 'Test Organization',
    vatNumber: 'VAT123',
    employeeCount: 100,
    supportedDietTypes: ['vegetarian'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembership = {
    id: 'membership-1',
    userId: 'user-1',
    orgId: 'org-1',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    organizationRepository = new OrganizationRepository();
    const { prisma } = await import('@/lib/prisma');
    mockPrisma = prisma as any;
  });

  describe('findById', () => {
    it('should find organization by id', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await organizationRepository.findById('org-1');

      expect(result).toEqual(mockOrganization);
      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
      });
    });

    it('should return null when organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      const result = await organizationRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create organization', async () => {
      const data: CreateOrganizationData = {
        name: 'New Organization',
        vatNumber: 'VAT456',
        employeeCount: 50,
        supportedDietTypes: ['vegan'],
      };
      mockPrisma.organization.create.mockResolvedValue({ ...mockOrganization, ...data });

      const result = await organizationRepository.create(data);

      expect(result.name).toBe('New Organization');
      expect(mockPrisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: data.name,
          vatNumber: data.vatNumber,
          employeeCount: data.employeeCount,
          supportedDietTypes: data.supportedDietTypes,
        },
      });
    });

    it('should create organization with empty supportedDietTypes', async () => {
      const data: CreateOrganizationData = {
        name: 'New Organization',
        vatNumber: 'VAT789',
        employeeCount: 25,
      };
      mockPrisma.organization.create.mockResolvedValue({ ...mockOrganization, ...data, supportedDietTypes: [] });

      await organizationRepository.create(data);

      expect(mockPrisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: data.name,
          vatNumber: data.vatNumber,
          employeeCount: data.employeeCount,
          supportedDietTypes: [],
        },
      });
    });
  });

  describe('createMembership', () => {
    it('should create membership', async () => {
      const data: CreateMembershipData = {
        userId: 'user-1',
        orgId: 'org-1',
        role: 'admin',
      };
      mockPrisma.membership.create.mockResolvedValue({ ...mockMembership, ...data });

      const result = await organizationRepository.createMembership(data);

      expect(result.userId).toBe('user-1');
      expect(mockPrisma.membership.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('findMembershipsByUserId', () => {
    it('should find memberships by user id', async () => {
      const membershipsWithOrg = [
        { ...mockMembership, org: mockOrganization },
      ];
      mockPrisma.membership.findMany.mockResolvedValue(membershipsWithOrg);

      const result = await organizationRepository.findMembershipsByUserId('user-1');

      expect(result).toEqual(membershipsWithOrg);
      expect(mockPrisma.membership.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { org: true },
      });
    });
  });

  describe('findMembership', () => {
    it('should find membership by userId without orgId', async () => {
      mockPrisma.membership.findUnique.mockResolvedValue(mockMembership);

      const result = await organizationRepository.findMembership('user-1');

      expect(result).toEqual(mockMembership);
      expect(mockPrisma.membership.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should find membership by userId with matching orgId', async () => {
      mockPrisma.membership.findUnique.mockResolvedValue(mockMembership);

      const result = await organizationRepository.findMembership('user-1', 'org-1');

      expect(result).toEqual(mockMembership);
      expect(mockPrisma.membership.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should return null when orgId does not match', async () => {
      mockPrisma.membership.findUnique.mockResolvedValue(mockMembership);

      const result = await organizationRepository.findMembership('user-1', 'org-2');

      expect(result).toBeNull();
    });

    it('should return null when membership not found', async () => {
      mockPrisma.membership.findUnique.mockResolvedValue(null);

      const result = await organizationRepository.findMembership('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update organization', async () => {
      const data: Partial<CreateOrganizationData> = {
        name: 'Updated Organization',
        employeeCount: 150,
      };
      const updatedOrg = { ...mockOrganization, ...data };
      mockPrisma.organization.update.mockResolvedValue(updatedOrg);

      const result = await organizationRepository.update('org-1', data);

      expect(result.name).toBe('Updated Organization');
      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: {
          name: data.name,
          vatNumber: data.vatNumber,
          employeeCount: data.employeeCount,
          supportedDietTypes: data.supportedDietTypes,
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete organization', async () => {
      mockPrisma.organization.delete.mockResolvedValue(mockOrganization);

      await organizationRepository.delete('org-1');

      expect(mockPrisma.organization.delete).toHaveBeenCalledWith({
        where: { id: 'org-1' },
      });
    });
  });

  describe('getOrganizationRepository factory', () => {
    it('should return singleton instance', () => {
      const instance1 = getOrganizationRepository();
      const instance2 = getOrganizationRepository();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(OrganizationRepository);
    });
  });
});



