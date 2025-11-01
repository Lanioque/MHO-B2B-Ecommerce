import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as registerRoute } from '../auth/register/route';
import { NextRequest } from 'next/server';

// Mock auth service
const mockRegisterUser = vi.fn();

vi.mock('@/lib/services/auth-service', () => ({
  createAuthService: () => ({
    registerUser: mockRegisterUser,
  }),
}));

describe('Auth API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      mockRegisterUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerRoute(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(mockRegisterUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      });
    });

    it('should reject invalid email', async () => {
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'Password123',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerRoute(req);

      expect(response.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'weak',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerRoute(req);

      expect(response.status).toBe(400);
    });

    it('should reject password without uppercase', async () => {
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerRoute(req);

      expect(response.status).toBe(400);
    });

    it('should register user without name', async () => {
      mockRegisterUser.mockResolvedValue({
        id: 'user-2',
        email: 'test2@example.com',
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test2@example.com',
          password: 'Password123',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerRoute(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test2@example.com');
    });
  });
});

