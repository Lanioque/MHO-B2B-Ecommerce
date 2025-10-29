/**
 * Centralized Configuration
 * Single source of truth for all environment-based configuration
 */

export interface ZohoRegionConfig {
  authUrl: string;
  apiUrl: string;
  booksApiUrl: string;
}

export type ZohoRegion = 'eu' | 'us' | 'com' | 'in';

export const ZOHO_REGION_CONFIGS: Record<ZohoRegion, ZohoRegionConfig> = {
  eu: {
    authUrl: 'https://accounts.zoho.eu',
    apiUrl: 'https://www.zohoapis.eu/inventory/v1',
    booksApiUrl: 'https://www.zohoapis.eu/books/v3',
  },
  us: {
    authUrl: 'https://accounts.zoho.com',
    apiUrl: 'https://www.zohoapis.com/inventory/v1',
    booksApiUrl: 'https://www.zohoapis.com/books/v3',
  },
  com: {
    authUrl: 'https://accounts.zoho.com',
    apiUrl: 'https://www.zohoapis.com/inventory/v1',
    booksApiUrl: 'https://www.zohoapis.com/books/v3',
  },
  in: {
    authUrl: 'https://accounts.zoho.in',
    apiUrl: 'https://www.zohoapis.in/inventory/v1',
    booksApiUrl: 'https://www.zohoapis.in/books/v3',
  },
} as const;

class Configuration {
  // Database
  readonly databaseUrl: string;

  // NextAuth
  readonly nextAuthSecret: string;
  readonly nextAuthUrl: string;

  // Zoho Configuration
  readonly zoho: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string;
    region: ZohoRegion;
    organizationId?: string;
    booksOrganizationId?: string;
    accessToken?: string;
    refreshToken?: string;
  };

  // Redis (optional)
  readonly redis?: {
    url: string;
    token: string;
  };

  constructor() {
    // Validate and load environment variables
    this.databaseUrl = this.getRequired('DATABASE_URL');
    this.nextAuthSecret = this.getRequired('NEXTAUTH_SECRET');
    this.nextAuthUrl = this.getOptional('NEXTAUTH_URL') || 'http://localhost:3000';

    // Zoho configuration
    this.zoho = {
      clientId: this.getRequired('ZOHO_CLIENT_ID'),
      clientSecret: this.getRequired('ZOHO_CLIENT_SECRET'),
      redirectUri: this.getRequired('ZOHO_REDIRECT_URI'),
      scope: this.getOptional('ZOHO_SCOPE') || 'ZohoInventory.items.READ',
      region: this.getZohoRegion(),
      organizationId: this.getOptional('ZOHO_ORGANIZATION_ID'),
      booksOrganizationId: this.getOptional('ZOHO_BOOKS_ORGANIZATION_ID') || this.getOptional('ZOHO_ORGANIZATION_ID'),
      accessToken: this.getOptional('ZOHO_ACCESS_TOKEN'),
      refreshToken: this.getOptional('ZOHO_REFRESH_TOKEN'),
    };

    // Redis (optional)
    const redisUrl = this.getOptional('REDIS_URL');
    const redisToken = this.getOptional('REDIS_TOKEN');
    if (redisUrl && redisToken) {
      this.redis = { url: redisUrl, token: redisToken };
    }
  }

  private getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private getOptional(key: string): string | undefined {
    return process.env[key];
  }

  private getZohoRegion(): ZohoRegion {
    const region = this.getOptional('ZOHO_REGION') || 'eu';
    if (!['eu', 'us', 'com', 'in'].includes(region)) {
      throw new Error(`Invalid ZOHO_REGION: ${region}. Must be one of: eu, us, com, in`);
    }
    return region as ZohoRegion;
  }

  getZohoRegionConfig(region?: ZohoRegion): ZohoRegionConfig {
    return ZOHO_REGION_CONFIGS[region || this.zoho.region];
  }

  isServiceAccountMode(): boolean {
    return !!(this.zoho.accessToken && this.zoho.refreshToken);
  }
}

// Singleton instance
let configInstance: Configuration | null = null;

export function getConfig(): Configuration {
  if (!configInstance) {
    configInstance = new Configuration();
  }
  return configInstance;
}

export const config = getConfig();


