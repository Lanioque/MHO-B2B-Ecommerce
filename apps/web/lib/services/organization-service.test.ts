import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService, createOrganizationService } from './organization-service';
import { NotFoundError } from '@/lib/errors';
import type { IOrganizationRepository } from '@/lib/domain/interfaces/IOrganizationRepository';
import type { IUnitOfWork } from '@/lib/domain/interfaces/IUnitOfWork';

describe('OrganizationService', () => {
  let organizationService: OrganizationService;
  let mockOrganizationRepository: IOrganizationRepository;
  let mockUnitOfWork: IUnitOfWork;

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
    org: mockOrganization,
  };

  beforeEach(() => {
    mockOrganizationRepository = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createMembership: vi.fn(),
      findMembershipsByUserId: vi.fn(),
      findMembership: vi.fn(),
    };

    mockUnitOfWork = {
      execute: vi.fn(),
    };

    organizationService = new OrganizationService(
      mockOrganizationRepository,
      mockUnitOfWork
    );
  });

  describe('getOrganizationById', () => {
    it('should return organization when found', async () => {
      vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(mockOrganization);

      const result = await organizationService.getOrganizationById('org-1');

      expect(result).toEqual(mockOrganization);
    });

    it('should throw NotFoundError when organization not found', async () => {
      vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(null);

      await expect(
        organizationService.getOrganizationById('non-existent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserOrganization', () => {
    it('should return user organization when found', async () => {
      vi.mocked(mockOrganizationRepository.findMembershipsByUserId).mockResolvedValue([mockMembership]);

      const result = await organizationService.getUserOrganization('user-1');

      expect(result).toEqual(mockMembership);
    });

    it('should return null when no organization found', async () => {
      vi.mocked(mockOrganizationRepository.findMembershipsByUserId).mockResolvedValue([]);

      const result = await organizationService.getUserOrganization('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getUserOrganizations', () => {
    it('should return all user organizations', async () => {
      const memberships = [mockMembership];
      vi.mocked(mockOrganizationRepository.findMembershipsByUserId).mockResolvedValue(memberships);

      const result = await organizationService.getUserOrganizations('user-1');

      expect(result).toEqual(memberships);
    });
  });

  describe('createOrganizationWithMembership', () => {
    it('should create organization with membership', async () => {
      const data = {
        organization: {
          name: 'New Organization',
          vatNumber: 'VAT456',
          employeeCount: 50,
        },
        userId: 'user-1',
        role: 'admin',
      };

      const mockTxRepo = {
        findMembership: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(mockOrganization),
        createMembership: vi.fn().mockResolvedValue(mockMembership),
      };

      vi.mocked(mockUnitOfWork.execute).mockImplementation(async (callback: any) => {
        return callback(mockTxRepo);
      });

      const result = await organizationService.createOrganizationWithMembership(data);

      expect(result.organization).toEqual(mockOrganization);
      expect(result.membership).toEqual(mockMembership);
    });

    it('should throw error when user already has membership', async () => {
      const data = {
        organization: {
          name: 'New Organization',
          vatNumber: 'VAT456',
          employeeCount: 50,
        },
        userId: 'user-1',
        role: 'admin',
      };

      const mockTxRepo = {
        findMembership: vi.fn().mockResolvedValue(mockMembership),
      };

      vi.mocked(mockUnitOfWork.execute).mockImplementation(async (callback: any) => {
        return callback(mockTxRepo);
      });

      await expect(
        organizationService.createOrganizationWithMembership(data)
      ).rejects.toThrow('User already belongs to an organization');
    });
  });

  describe('updateOrganization', () => {
    it('should update organization', async () => {
      const data = { name: 'Updated Organization' };
      const updatedOrg = { ...mockOrganization, ...data };

      vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(mockOrganization);
      vi.mocked(mockOrganizationRepository.update).mockResolvedValue(updatedOrg);

      const result = await organizationService.updateOrganization('org-1', data);

      expect(result.name).toBe('Updated Organization');
    });

    it('should throw NotFoundError when organization does not exist', async () => {
      const data = { name: 'Updated' };
      vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(null);

      await expect(
        organizationService.updateOrganization('non-existent', data)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization', async () => {
      vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(mockOrganization);
      vi.mocked(mockOrganizationRepository.delete).mockResolvedValue(undefined);

      await organizationService.deleteOrganization('org-1');

      expect(mockOrganizationRepository.delete).toHaveBeenCalledWith('org-1');
    });

    it('should throw NotFoundError when organization does not exist', async () => {
      vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(null);

      await expect(
        organizationService.deleteOrganization('non-existent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('checkUserMembership', () => {
    it('should return membership when found', async () => {
      vi.mocked(mockOrganizationRepository.findMembership).mockResolvedValue(mockMembership);

      const result = await organizationService.checkUserMembership('user-1', 'org-1');

      expect(result).toEqual(mockMembership);
      expect(mockOrganizationRepository.findMembership).toHaveBeenCalledWith('user-1', 'org-1');
    });

    it('should return null when membership not found', async () => {
      vi.mocked(mockOrganizationRepository.findMembership).mockResolvedValue(null);

      const result = await organizationService.checkUserMembership('user-1', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('createOrganizationService factory', () => {
    it('should create service with provided dependencies', () => {
      const service = createOrganizationService(
        mockOrganizationRepository,
        mockUnitOfWork
      );

      expect(service).toBeInstanceOf(OrganizationService);
    });

    it('should create service with default dependencies', () => {
      const service = createOrganizationService();

      expect(service).toBeInstanceOf(OrganizationService);
    });
  });
});



