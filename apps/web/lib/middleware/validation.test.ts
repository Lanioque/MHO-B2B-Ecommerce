import { describe, it, expect, vi } from 'vitest';
import { validateRequestBody, validateQueryParams, parsePaginationParams } from './validation';
import { z } from 'zod';
import { NextRequest } from 'next/server';

// Mock NextRequest
const createMockRequest = (body?: any, searchParams?: Record<string, string>) => {
  return {
    json: vi.fn().mockResolvedValue(body || {}),
    nextUrl: {
      searchParams: {
        get: (key: string) => searchParams?.[key] || null,
        entries: () => Object.entries(searchParams || {}),
      },
    },
  } as unknown as NextRequest;
};

describe('Validation Middleware', () => {
  describe('validateRequestBody', () => {
    it('should validate and return parsed body', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const body = { name: 'John', age: 30 };
      const req = createMockRequest(body);

      const result = await validateRequestBody(req, schema);

      expect(result).toEqual(body);
      expect(req.json).toHaveBeenCalled();
    });

    it('should throw ZodError for invalid body', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const body = { name: 'John', age: 'invalid' };
      const req = createMockRequest(body);

      await expect(validateRequestBody(req, schema)).rejects.toThrow();
    });

    it('should handle complex schemas', async () => {
      const schema = z.object({
        email: z.string().email(),
        items: z.array(z.object({ id: z.string(), quantity: z.number() })),
      });
      const body = {
        email: 'test@example.com',
        items: [{ id: 'item-1', quantity: 5 }],
      };
      const req = createMockRequest(body);

      const result = await validateRequestBody(req, schema);

      expect(result.email).toBe('test@example.com');
      expect(result.items).toHaveLength(1);
    });
  });

  describe('validateQueryParams', () => {
    it('should validate and return parsed query params', async () => {
      const schema = z.object({
        page: z.string().transform(Number),
        search: z.string().optional(),
      });
      const searchParams = { page: '1', search: 'test' };
      const req = createMockRequest(undefined, searchParams);

      const result = await validateQueryParams(req, schema);

      expect(result.page).toBe(1);
      expect(result.search).toBe('test');
    });

    it('should handle missing optional params', async () => {
      const schema = z.object({
        page: z.string().transform(Number),
        search: z.string().optional(),
      });
      const searchParams = { page: '1' };
      const req = createMockRequest(undefined, searchParams);

      const result = await validateQueryParams(req, schema);

      expect(result.page).toBe(1);
      expect(result.search).toBeUndefined();
    });

    it('should transform string to number (may result in NaN)', async () => {
      const schema = z.object({
        page: z.string().transform(Number),
      });
      const searchParams = { page: 'invalid' };
      const req = createMockRequest(undefined, searchParams);

      const result = await validateQueryParams(req, schema);
      // Note: transform doesn't validate, so NaN is possible
      expect(isNaN(result.page)).toBe(true);
    });
  });

  describe('parsePaginationParams', () => {
    it('should parse page and pageSize from query params', () => {
      const req = createMockRequest(undefined, { page: '2', pageSize: '50' });

      const result = parsePaginationParams(req);

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(50);
    });

    it('should use default values when params are missing', () => {
      const req = createMockRequest(undefined, {});

      const result = parsePaginationParams(req);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should use default values when params are null', () => {
      const req = createMockRequest(undefined, { page: null as any, pageSize: null as any });

      const result = parsePaginationParams(req);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should enforce minimum page of 1', () => {
      const req = createMockRequest(undefined, { page: '0', pageSize: '20' });

      const result = parsePaginationParams(req);

      expect(result.page).toBe(1);
    });

    it('should enforce minimum pageSize of 1', () => {
      const req = createMockRequest(undefined, { page: '1', pageSize: '0' });

      const result = parsePaginationParams(req);

      expect(result.pageSize).toBe(1);
    });

    it('should enforce maximum pageSize of 100', () => {
      const req = createMockRequest(undefined, { page: '1', pageSize: '200' });

      const result = parsePaginationParams(req);

      expect(result.pageSize).toBe(100);
    });

    it('should handle negative page values', () => {
      const req = createMockRequest(undefined, { page: '-5', pageSize: '20' });

      const result = parsePaginationParams(req);

      expect(result.page).toBe(1);
    });

    it('should handle invalid numeric strings', () => {
      const req = createMockRequest(undefined, { page: 'abc', pageSize: 'xyz' });

      const result = parsePaginationParams(req);

      // Should default to safe values when parsing fails
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });
});

