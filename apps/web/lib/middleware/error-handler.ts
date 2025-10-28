/**
 * Centralized Error Handler
 * Provides consistent error responses across all routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { ZohoError } from '@/lib/clients/zoho-client';

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

export function handleError(error: unknown): NextResponse<ErrorResponse> {
  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // Custom application errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Zoho-specific errors
  if (error instanceof ZohoError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'ZOHO_ERROR',
      },
      { status: error.statusCode || 500 }
    );
  }

  // Generic errors with statusCode property
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const err = error as { message?: string; statusCode?: number };
    return NextResponse.json(
      {
        error: err.message || 'Internal server error',
      },
      { status: err.statusCode || 500 }
    );
  }

  // Unknown errors
  console.error('[ErrorHandler] Unhandled error:', error);
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for route handlers
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | NextResponse<ErrorResponse>> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}


