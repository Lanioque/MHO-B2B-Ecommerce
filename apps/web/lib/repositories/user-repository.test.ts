import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRepository, getUserRepository } from './user-repository';
import { prisma } from '@/lib/prisma';
import type { CreateUserData } from '@/lib/domain/interfaces/IUserRepository';
import type { User, Membership } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;
  const mockPrisma = prisma as any;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository = new UserRepository();
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByEmailWithMemberships', () => {
    it('should find user with memberships', async () => {
      const mockUser: User & { memberships: Membership[] } = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        memberships: [
          {
            id: 'membership-1',
            userId: 'user-1',
            orgId: 'org-1',
            role: 'ADMIN',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmailWithMemberships('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { memberships: true },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findByEmailWithMemberships('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user with all fields', async () => {
      const userData: CreateUserData = {
        email: 'newuser@example.com',
        password: 'hashedPassword',
        name: 'New User',
      };

      const createdUser: User = {
        id: 'user-2',
        email: userData.email,
        password: userData.password,
        name: userData.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await userRepository.create(userData);

      expect(result).toEqual(createdUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          password: true,
        },
      });
    });

    it('should create user without name', async () => {
      const userData: CreateUserData = {
        email: 'noname@example.com',
        password: 'hashedPassword',
        name: null,
      };

      const createdUser: User = {
        id: 'user-3',
        email: userData.email,
        password: userData.password,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await userRepository.create(userData);

      expect(result.name).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateData: Partial<CreateUserData> = {
        name: 'Updated Name',
      };

      const updatedUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Updated Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userRepository.update('user-1', updateData);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          email: updateData.email,
          password: updateData.password,
          name: updateData.name,
        },
      });
    });

    it('should update user password', async () => {
      const updateData: Partial<CreateUserData> = {
        password: 'newHashedPassword',
      };

      const updatedUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'newHashedPassword',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userRepository.update('user-1', updateData);

      expect(result.password).toBe('newHashedPassword');
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      mockPrisma.user.delete.mockResolvedValue(undefined);

      await userRepository.delete('user-1');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });

  describe('getUserRepository singleton', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = getUserRepository();
      const instance2 = getUserRepository();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(UserRepository);
    });

    it('should create new instance on first call', () => {
      const instance = getUserRepository();

      expect(instance).toBeInstanceOf(UserRepository);
    });
  });
});



