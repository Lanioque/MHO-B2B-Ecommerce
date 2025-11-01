import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth-service';
import { ConflictError } from '@/lib/errors';
import type { IUserRepository } from '@/lib/domain/interfaces/IUserRepository';
import type { User } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    // Create a mock repository
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByEmailWithMemberships: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    authService = new AuthService(mockUserRepository);
  });

  describe('registerUser', () => {
    it('should throw ConflictError when user already exists', async () => {
      const existingUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

      await expect(
        authService.registerUser({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow(ConflictError);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should create user with hashed password when user does not exist', async () => {
      const newUser: User = {
        id: 'user-2',
        email: 'newuser@example.com',
        password: 'hashedPassword123',
        name: 'New User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);

      const result = await authService.registerUser({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockUserRepository.create).toHaveBeenCalled();
      
      // Verify password was hashed (not the original password)
      const createCall = vi.mocked(mockUserRepository.create).mock.calls[0];
      expect(createCall[0].password).not.toBe('password123');
      expect(createCall[0].password).toBeTruthy();

      // Verify password is not returned in result
      expect(result.password).toBeUndefined();
      expect(result.email).toBe('newuser@example.com');
      expect(result.name).toBe('New User');
    });

    it('should create user without name when name is not provided', async () => {
      const newUser: User = {
        id: 'user-3',
        email: 'noname@example.com',
        password: 'hashedPassword',
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);

      const result = await authService.registerUser({
        email: 'noname@example.com',
        password: 'password123',
      });

      expect(result.email).toBe('noname@example.com');
      expect(result.password).toBeUndefined();
    });
  });

  describe('hashPassword', () => {
    it('should hash password using bcrypt', async () => {
      const password = 'testPassword123';
      const hashedPassword = await authService.hashPassword(password);

      expect(hashedPassword).toBeTruthy();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(20); // bcrypt hashes are long
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'samePassword';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      // bcrypt includes salt, so same password should produce different hashes
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const correctPassword = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await authService.hashPassword(correctPassword);

      const isValid = await authService.verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('createAuthService factory', () => {
    it('should create service with provided repository', async () => {
      const mockRepo = {
        findById: vi.fn(),
        findByEmail: vi.fn(),
        findByEmailWithMemberships: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };

      const { createAuthService } = await import('./auth-service');
      const service = createAuthService(mockRepo);

      expect(service).toBeInstanceOf(AuthService);
    });

    it('should create service with default repository when none provided', async () => {
      const { createAuthService } = await import('./auth-service');
      const service = createAuthService();

      expect(service).toBeInstanceOf(AuthService);
    });
  });
});

