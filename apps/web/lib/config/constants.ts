/**
 * Application Constants
 * Centralized location for all magic numbers and configuration constants
 */

export const DATABASE_CONSTANTS = {
  /** Prisma String field maximum length */
  MAX_STRING_LENGTH: 191,
  /** Maximum slug length for URLs */
  MAX_SLUG_LENGTH: 191,
} as const;

export const PAGINATION_CONSTANTS = {
  /** Default page size for list queries */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum page size allowed */
  MAX_PAGE_SIZE: 100,
  /** Default page number */
  DEFAULT_PAGE: 1,
} as const;

export const ZOHO_CONSTANTS = {
  /** Zoho API items per page limit */
  ITEMS_PER_PAGE: 200,
  /** Default batch size for processing Zoho items */
  DEFAULT_BATCH_SIZE: 50,
  /** Token expiry buffer in minutes */
  TOKEN_EXPIRY_BUFFER_MINUTES: 5,
} as const;

export const AUTH_CONSTANTS = {
  /** BCrypt salt rounds for password hashing */
  BCRYPT_SALT_ROUNDS: 12,
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
} as const;

export const BATCH_PROCESSING = {
  /** Default batch size for bulk operations */
  DEFAULT_BATCH_SIZE: 50,
  /** Maximum concurrent batch operations */
  MAX_CONCURRENT_BATCHES: 3,
} as const;

export const FILE_SYSTEM = {
  /** Public products directory path */
  PRODUCTS_DIR: 'public/products',
} as const;


