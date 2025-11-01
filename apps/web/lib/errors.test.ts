import { describe, it, expect } from 'vitest';
import {
  AppError,
  UnauthorizedError,
  PermissionError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
} from './errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default status code 500', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBeUndefined();
      expect(error.name).toBe('AppError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create error with custom status code', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.statusCode).toBe(400);
    });

    it('should create error with custom code', () => {
      const error = new AppError('Test error', 400, 'CUSTOM_CODE');
      
      expect(error.code).toBe('CUSTOM_CODE');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedError();
      
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.name).toBe('UnauthorizedError');
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create error with custom message', () => {
      const error = new UnauthorizedError('Custom unauthorized message');
      
      expect(error.message).toBe('Custom unauthorized message');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PermissionError', () => {
    it('should create error with default message', () => {
      const error = new PermissionError();
      
      expect(error.message).toBe('Permission denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.name).toBe('PermissionError');
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create error with custom message', () => {
      const error = new PermissionError('Custom permission message');
      
      expect(error.message).toBe('Custom permission message');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('PERMISSION_DENIED');
    });
  });

  describe('NotFoundError', () => {
    it('should create error with default message', () => {
      const error = new NotFoundError();
      
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('NotFoundError');
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create error with custom message', () => {
      const error = new NotFoundError('User not found');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('ValidationError', () => {
    it('should create error with default message', () => {
      const error = new ValidationError();
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create error with custom message', () => {
      const error = new ValidationError('Invalid input data');
      
      expect(error.message).toBe('Invalid input data');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should include validation errors', () => {
      const validationErrors = {
        email: 'Email is required',
        password: 'Password must be at least 8 characters',
      };
      const error = new ValidationError('Validation failed', validationErrors);
      
      expect(error.errors).toEqual(validationErrors);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('ConflictError', () => {
    it('should create error with default message', () => {
      const error = new ConflictError();
      
      expect(error.message).toBe('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.name).toBe('ConflictError');
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create error with custom message', () => {
      const error = new ConflictError('User already exists');
      
      expect(error.message).toBe('User already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('RateLimitError', () => {
    it('should create error with default message', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.name).toBe('RateLimitError');
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create error with custom message', () => {
      const error = new RateLimitError('Too many requests');
      
      expect(error.message).toBe('Too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});



