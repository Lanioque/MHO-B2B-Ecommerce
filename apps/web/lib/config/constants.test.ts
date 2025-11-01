import { describe, it, expect } from 'vitest';
import {
  DATABASE_CONSTANTS,
  PAGINATION_CONSTANTS,
  ZOHO_CONSTANTS,
  AUTH_CONSTANTS,
  BATCH_PROCESSING,
  FILE_SYSTEM,
} from './constants';

describe('Constants', () => {
  describe('DATABASE_CONSTANTS', () => {
    it('should have MAX_STRING_LENGTH', () => {
      expect(DATABASE_CONSTANTS.MAX_STRING_LENGTH).toBe(191);
    });

    it('should have MAX_SLUG_LENGTH', () => {
      expect(DATABASE_CONSTANTS.MAX_SLUG_LENGTH).toBe(191);
    });
  });

  describe('PAGINATION_CONSTANTS', () => {
    it('should have DEFAULT_PAGE_SIZE', () => {
      expect(PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE).toBe(20);
    });

    it('should have MAX_PAGE_SIZE', () => {
      expect(PAGINATION_CONSTANTS.MAX_PAGE_SIZE).toBe(100);
    });

    it('should have DEFAULT_PAGE', () => {
      expect(PAGINATION_CONSTANTS.DEFAULT_PAGE).toBe(1);
    });
  });

  describe('ZOHO_CONSTANTS', () => {
    it('should have ITEMS_PER_PAGE', () => {
      expect(ZOHO_CONSTANTS.ITEMS_PER_PAGE).toBe(200);
    });

    it('should have DEFAULT_BATCH_SIZE', () => {
      expect(ZOHO_CONSTANTS.DEFAULT_BATCH_SIZE).toBe(50);
    });

    it('should have TOKEN_EXPIRY_BUFFER_MINUTES', () => {
      expect(ZOHO_CONSTANTS.TOKEN_EXPIRY_BUFFER_MINUTES).toBe(5);
    });
  });

  describe('AUTH_CONSTANTS', () => {
    it('should have BCRYPT_SALT_ROUNDS', () => {
      expect(AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS).toBe(12);
    });

    it('should have MIN_PASSWORD_LENGTH', () => {
      expect(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH).toBe(8);
    });
  });

  describe('BATCH_PROCESSING', () => {
    it('should have DEFAULT_BATCH_SIZE', () => {
      expect(BATCH_PROCESSING.DEFAULT_BATCH_SIZE).toBe(50);
    });

    it('should have MAX_CONCURRENT_BATCHES', () => {
      expect(BATCH_PROCESSING.MAX_CONCURRENT_BATCHES).toBe(3);
    });
  });

  describe('FILE_SYSTEM', () => {
    it('should have PRODUCTS_DIR', () => {
      expect(FILE_SYSTEM.PRODUCTS_DIR).toBe('public/products');
    });
  });

  describe('Constants immutability', () => {
    it('should have correct constant values', () => {
      // Verify all constants are defined and have expected types
      expect(typeof DATABASE_CONSTANTS.MAX_STRING_LENGTH).toBe('number');
      expect(typeof PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE).toBe('number');
      expect(typeof AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS).toBe('number');
      expect(typeof FILE_SYSTEM.PRODUCTS_DIR).toBe('string');
    });

    it('should export all required constants', () => {
      expect(DATABASE_CONSTANTS).toBeDefined();
      expect(PAGINATION_CONSTANTS).toBeDefined();
      expect(ZOHO_CONSTANTS).toBeDefined();
      expect(AUTH_CONSTANTS).toBeDefined();
      expect(BATCH_PROCESSING).toBeDefined();
      expect(FILE_SYSTEM).toBeDefined();
    });
  });
});

