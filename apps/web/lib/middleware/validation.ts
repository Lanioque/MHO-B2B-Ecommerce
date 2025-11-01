/**
 * Validation Middleware
 * Provides reusable validation for request bodies
 */

import { NextRequest } from 'next/server';
import { z, ZodSchema } from 'zod';

export async function validateRequestBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}

export async function validateQueryParams<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  return schema.parse(params);
}

/**
 * Parse pagination parameters from query string
 */
export function parsePaginationParams(req: NextRequest) {
  const pageParam = req.nextUrl.searchParams.get('page') || '1';
  const pageSizeParam = req.nextUrl.searchParams.get('pageSize') || '20';
  
  const page = parseInt(pageParam, 10);
  const pageSize = parseInt(pageSizeParam, 10);

  return {
    page: isNaN(page) ? 1 : Math.max(1, page),
    pageSize: isNaN(pageSize) ? 20 : Math.min(100, Math.max(1, pageSize)),
  };
}


