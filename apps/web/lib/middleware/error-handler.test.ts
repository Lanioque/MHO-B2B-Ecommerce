import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleError, withErrorHandler } from './error-handler';
import { ZodError } from 'zod';
import { AppError, ValidationError, ConflictError, UnauthorizedError } from '@/lib/errors';
import { NextResponse } from 'next/server';

// Mock ZohoError
class ZohoError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ZohoError';
  }
}

vi.mock('@/lib/clients/zoho-client', () => ({
  ZohoError: class ZohoError extends Error {
    constructor(message: string, public statusCode?: number) {
      super(message);
      this.name = 'ZohoError';
    }
  },
}));

describe('Error Handler', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('handleError', () => {
    it('should handle ZodError', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
      ]);

      const response = handleError(zodError);
      const json = response as unknown as { json: () => Promise<any> };

      expect(response.status).toBe(400);
      // Note: In actual Next.js environment, we'd need to await response.json()
      // For unit tests, we verify the response structure
    });

    it('should handle AppError', () => {
      const appError = new AppError('Test error', 400, 'TEST_ERROR');

      const response = handleError(appError);

      expect(response.status).toBe(400);
    });

    it('should handle ValidationError with details', () => {
      const validationError = new ValidationError('Validation failed', { field: 'error' });

      const response = handleError(validationError);

      expect(response.status).toBe(400);
    });

    it('should handle ConflictError', () => {
      const conflictError = new ConflictError('Resource already exists');

      const response = handleError(conflictError);

      expect(response.status).toBe(409);
    });

    it('should handle UnauthorizedError', () => {
      const unauthorizedError = new UnauthorizedError('Unauthorized access');

      const response = handleError(unauthorizedError);

      expect(response.status).toBe(401);
    });

    it('should handle ZohoError', async () => {
      const { ZohoError } = await import('@/lib/clients/zoho-client');
      const zohoError = new ZohoError('Zoho API error', 429);

      const response = handleError(zohoError);

      expect(response.status).toBe(429);
    });

    it('should handle ZohoError without statusCode', async () => {
      const { ZohoError } = await import('@/lib/clients/zoho-client');
      const zohoError = new ZohoError('Zoho API error');

      const response = handleError(zohoError);

      expect(response.status).toBe(500);
    });

    it('should handle error with statusCode property', () => {
      const error = {
        message: 'Custom error',
        statusCode: 418,
      };

      const response = handleError(error);

      expect(response.status).toBe(418);
    });

    it('should handle error with statusCode but no message', () => {
      const error = {
        statusCode: 503,
      };

      const response = handleError(error);

      expect(response.status).toBe(503);
    });

    it('should handle unknown errors', () => {
      const unknownError = 'String error';

      const response = handleError(unknownError);

      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle null errors', () => {
      const response = handleError(null);

      expect(response.status).toBe(500);
    });

    it('should handle undefined errors', () => {
      const response = handleError(undefined);

      expect(response.status).toBe(500);
    });
  });

  describe('withErrorHandler', () => {
    it('should return handler result when no error occurs', async () => {
      const handler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withErrorHandler(handler);

      const result = await wrappedHandler('arg1', 'arg2');

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toEqual({ success: true });
    });

    it('should catch and handle errors', async () => {
      const handler = vi.fn().mockRejectedValue(new AppError('Test error', 400));
      const wrappedHandler = withErrorHandler(handler);

      const result = await wrappedHandler('arg');

      expect(handler).toHaveBeenCalledWith('arg');
      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(400);
      }
    });

    it('should handle ZodError in wrapped handler', async () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string',
        },
      ]);
      const handler = vi.fn().mockRejectedValue(zodError);
      const wrappedHandler = withErrorHandler(handler);

      const result = await wrappedHandler();

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(400);
      }
    });
  });
});



