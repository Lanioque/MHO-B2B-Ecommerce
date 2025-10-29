/**
 * Unified Zoho Client
 * Single source of truth for Zoho API interactions
 * Consolidates apps/web/lib/zoho.ts and services/zoho-sync/src/zoho-client.ts
 */

import { prisma } from '@/lib/prisma';
import { config, ZohoRegion } from '@/lib/config';
import { RegionStrategyFactory } from '@/lib/config/regions';
import { ZOHO_CONSTANTS } from '@/lib/config/constants';
import {
  IZohoClient,
  ZohoTokenResponse,
  ZohoOrganization,
  ZohoItem,
  ZohoContact,
  ZohoSalesOrder,
  ZohoInvoice,
} from '@/lib/domain/interfaces/IZohoClient';

export class ZohoError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ZohoError';
  }
}

export class ZohoClient implements IZohoClient {
  /**
   * Build Zoho OAuth authorization URL
   */
  getAuthUrl(orgId: string): string {
    const regionStrategy = RegionStrategyFactory.getStrategy(config.zoho.region);
    
    const params = new URLSearchParams({
      scope: config.zoho.scope,
      client_id: config.zoho.clientId,
      response_type: 'code',
      redirect_uri: config.zoho.redirectUri,
      access_type: 'offline',
      prompt: 'consent',
      state: orgId,
    });

    return `${regionStrategy.getAuthUrl()}/oauth/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCode(code: string, region?: ZohoRegion): Promise<ZohoTokenResponse> {
    const regionStrategy = RegionStrategyFactory.getStrategy(region || config.zoho.region);
    
    const response = await fetch(`${regionStrategy.getAuthUrl()}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.zoho.clientId,
        client_secret: config.zoho.clientSecret,
        redirect_uri: config.zoho.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ZohoError(`Failed to exchange code: ${error}`, response.status);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string, region?: ZohoRegion): Promise<ZohoTokenResponse> {
    const regionStrategy = RegionStrategyFactory.getStrategy(region || config.zoho.region);
    
    console.log(`[Zoho] Refreshing token using endpoint: ${regionStrategy.getAuthUrl()}`);
    
    const response = await fetch(`${regionStrategy.getAuthUrl()}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.zoho.clientId,
        client_secret: config.zoho.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ZohoError(`Failed to refresh token: ${error}`, response.status);
    }

    return response.json();
  }

  /**
   * Get valid access token (refresh if expired)
   */
  async getValidAccessToken(orgId?: string): Promise<string> {
    // Check if using service account credentials from environment
    if (config.isServiceAccountMode()) {
      return config.zoho.accessToken!;
    }

    // Otherwise, use per-org OAuth credentials from database
    if (!orgId) {
      throw new ZohoError('orgId is required when not using service account credentials');
    }

    const connection = await prisma.zohoConnection.findUnique({
      where: { orgId },
    });

    if (!connection) {
      throw new ZohoError('No Zoho connection found for this organization');
    }

    console.log(
      `[Zoho] Access token expires at: ${connection.expiresAt} (region: ${connection.region}, scope: ${connection.scope || 'not set'})`
    );
    
    const now = new Date();
    const expiresAt = new Date(connection.expiresAt);
    expiresAt.setMinutes(expiresAt.getMinutes() - ZOHO_CONSTANTS.TOKEN_EXPIRY_BUFFER_MINUTES);

    if (now > expiresAt) {
      console.log('[Zoho] Access token expired or expiring soon, refreshing...');
      const tokenData = await this.refreshToken(
        connection.refreshToken,
        connection.region as ZohoRegion
      );

      await prisma.zohoConnection.update({
        where: { orgId },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? connection.refreshToken,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          scope: tokenData.scope || connection.scope,
        },
      });

      console.log(`[Zoho] Token refreshed with scope: ${tokenData.scope || 'not provided'}`);
      return tokenData.access_token;
    }

    return connection.accessToken;
  }

  /**
   * Get region from connection
   */
  private async getRegionFromConnection(orgId: string): Promise<ZohoRegion> {
    const connection = await prisma.zohoConnection.findUnique({
      where: { orgId },
      select: { region: true },
    });
    return (connection?.region || config.zoho.region) as ZohoRegion;
  }

  /**
   * Fetch organizations from Zoho for the authenticated user
   */
  async fetchOrganizations(orgId: string): Promise<ZohoOrganization[]> {
    const accessToken = await this.getValidAccessToken(orgId);
    const regionStrategy = RegionStrategyFactory.getStrategy(config.zoho.region);

    const response = await fetch(`${regionStrategy.getApiUrl()}/organizations`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ZohoError(`Failed to fetch organizations: ${error}`, response.status);
    }

    const data = await response.json();
    return data.organizations || [];
  }

  /**
   * Fetch items from Zoho Inventory with pagination support
   */
  async fetchItems(orgId?: string, zohoOrganizationId?: string): Promise<ZohoItem[]> {
    const accessToken = await this.getValidAccessToken(orgId);

    // Determine the Zoho organization ID to use
    let finalZohoOrgId = zohoOrganizationId;
    
    if (!finalZohoOrgId) {
      if (config.zoho.organizationId) {
        finalZohoOrgId = config.zoho.organizationId;
      } else if (orgId) {
        const organizations = await this.fetchOrganizations(orgId);
        if (organizations.length === 0) {
          throw new ZohoError('No Zoho organizations found');
        }
        finalZohoOrgId = organizations[0].organization_id;
      } else {
        throw new ZohoError('Zoho organization ID is required');
      }
    }

    // Get region from connection if available
    let region = config.zoho.region;
    if (orgId) {
      const connection = await prisma.zohoConnection.findUnique({
        where: { orgId },
        select: { region: true },
      });
      if (connection) {
        region = connection.region as ZohoRegion;
      }
    }
    
    const regionStrategy = RegionStrategyFactory.getStrategy(region);
    
    // Fetch all items with pagination
    let allItems: ZohoItem[] = [];
    let page = 1;
    const pageSize = ZOHO_CONSTANTS.ITEMS_PER_PAGE;
    let hasMore = true;

    console.log(`[Zoho] Starting paginated fetch for org: ${finalZohoOrgId} (region: ${region})`);

    while (hasMore) {
      const url = new URL(`${regionStrategy.getApiUrl()}/items`);
      url.searchParams.append('organization_id', finalZohoOrgId);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('per_page', pageSize.toString());

      console.log(`[Zoho] Fetching page ${page} from: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      });
      
      console.log(`[Zoho] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch items from Zoho (HTTP ${response.status})`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          if (errorText) {
            errorMessage += `: ${errorText}`;
          }
        }
        
        throw new ZohoError(errorMessage, response.status);
      }

      const data = await response.json();
      const items = data.items || [];
      
      allItems = allItems.concat(items);
      
      console.log(
        `[Zoho] Page ${page}: fetched ${items.length} items (total so far: ${allItems.length})`
      );

      // Check if there are more pages
      if (data.page_context) {
        hasMore = data.page_context.has_more_page === true;
        page++;
      } else {
        hasMore = items.length === pageSize;
        page++;
      }
    }

    console.log(`[Zoho] Pagination complete! Total items fetched: ${allItems.length}`);
    
    return allItems;
  }

  /**
   * Get Zoho Books organization ID
   */
  private async getBooksOrganizationId(orgId?: string): Promise<string> {
    if (config.zoho.booksOrganizationId) {
      return config.zoho.booksOrganizationId;
    }
    
    if (orgId) {
      const connection = await prisma.zohoConnection.findUnique({
        where: { orgId },
        select: { zohoOrganizationId: true },
      });
      if (connection?.zohoOrganizationId) {
        return connection.zohoOrganizationId;
      }
    }
    
    if (config.zoho.organizationId) {
      return config.zoho.organizationId;
    }
    
    throw new ZohoError('Zoho Books organization ID is required');
  }

  /**
   * Create a contact (customer) in Zoho Books
   */
  async createContact(orgId: string, contactData: ZohoContact): Promise<ZohoContact> {
    const accessToken = await this.getValidAccessToken(orgId);
    const region = await this.getRegionFromConnection(orgId);
    const regionStrategy = RegionStrategyFactory.getStrategy(region);
    const booksOrgId = await this.getBooksOrganizationId(orgId);

    console.log(`[Zoho] Creating contact in Books API with orgId: ${booksOrgId}, region: ${region}, booksApiUrl: ${regionStrategy.getBooksApiUrl()}`);

    const response = await fetch(
      `${regionStrategy.getBooksApiUrl()}/contacts?organization_id=${booksOrgId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Zoho] Create contact failed: ${errorText}`);
      
      // Try to parse error for better message
      let errorMessage = `Failed to create contact: ${errorText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.code === 57) {
          errorMessage = `Authorization failed. Ensure your Zoho app has Books API access and you're using the correct organization ID. Current org: ${booksOrgId}`;
        }
      } catch {
        // Use raw error text
      }
      
      throw new ZohoError(errorMessage, response.status);
    }

    const data = await response.json();
    return data.contact;
  }

  /**
   * Get contact by email
   */
  async getContactByEmail(orgId: string, email: string): Promise<ZohoContact | null> {
    const accessToken = await this.getValidAccessToken(orgId);
    const regionStrategy = RegionStrategyFactory.getStrategy(config.zoho.region);
    const booksOrgId = await this.getBooksOrganizationId(orgId);

    const response = await fetch(
      `${regionStrategy.getBooksApiUrl()}/contacts?organization_id=${booksOrgId}&email_contains=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.text();
      throw new ZohoError(`Failed to get contact: ${error}`, response.status);
    }

    const data = await response.json();
    const contacts = data.contacts || [];
    return contacts.length > 0 ? contacts[0] : null;
  }

  /**
   * Create a sales order in Zoho Books
   */
  async createSalesOrder(orgId: string, salesOrderData: ZohoSalesOrder): Promise<ZohoSalesOrder> {
    const accessToken = await this.getValidAccessToken(orgId);
    const region = await this.getRegionFromConnection(orgId);
    const regionStrategy = RegionStrategyFactory.getStrategy(region);
    const booksOrgId = await this.getBooksOrganizationId(orgId);

    console.log(`[Zoho] Creating sales order in Books API with orgId: ${booksOrgId}, region: ${region}`);

    const response = await fetch(
      `${regionStrategy.getBooksApiUrl()}/salesorders?organization_id=${booksOrgId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salesOrderData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new ZohoError(`Failed to create sales order: ${error}`, response.status);
    }

    const data = await response.json();
    return data.salesorder;
  }

  /**
   * Create an invoice in Zoho Books
   */
  async createInvoice(orgId: string, invoiceData: Partial<ZohoInvoice>): Promise<ZohoInvoice> {
    const accessToken = await this.getValidAccessToken(orgId);
    const region = await this.getRegionFromConnection(orgId);
    const regionStrategy = RegionStrategyFactory.getStrategy(region);
    const booksOrgId = await this.getBooksOrganizationId(orgId);

    console.log(`[Zoho] Creating invoice in Books API with orgId: ${booksOrgId}, region: ${region}`);
    console.log(`[Zoho] Invoice data:`, JSON.stringify(invoiceData, null, 2));

    const response = await fetch(
      `${regionStrategy.getBooksApiUrl()}/invoices?organization_id=${booksOrgId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Zoho] Create invoice failed: ${errorText}`);
      throw new ZohoError(`Failed to create invoice: ${errorText}`, response.status);
    }

    const data = await response.json();
    console.log(`[Zoho] Invoice created successfully:`, data.invoice?.invoice_id);
    return data.invoice;
  }

  /**
   * Get invoice details including PDF URL
   */
  async getInvoice(orgId: string, invoiceId: string): Promise<ZohoInvoice> {
    const accessToken = await this.getValidAccessToken(orgId);
    const region = await this.getRegionFromConnection(orgId);
    const regionStrategy = RegionStrategyFactory.getStrategy(region);
    const booksOrgId = await this.getBooksOrganizationId(orgId);

    const response = await fetch(
      `${regionStrategy.getBooksApiUrl()}/invoices/${invoiceId}?organization_id=${booksOrgId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new ZohoError(`Failed to get invoice: ${error}`, response.status);
    }

    const data = await response.json();
    return data.invoice;
  }

  /**
   * Mark invoice as sent in Zoho Books
   */
  async sendInvoice(orgId: string, invoiceId: string): Promise<ZohoInvoice> {
    const accessToken = await this.getValidAccessToken(orgId);
    const region = await this.getRegionFromConnection(orgId);
    const regionStrategy = RegionStrategyFactory.getStrategy(region);
    const booksOrgId = await this.getBooksOrganizationId(orgId);

    console.log(`[Zoho] Marking invoice ${invoiceId} as sent`);

    const response = await fetch(
      `${regionStrategy.getBooksApiUrl()}/invoices/${invoiceId}/status/sent?organization_id=${booksOrgId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Zoho] Send invoice failed: ${errorText}`);
      throw new ZohoError(`Failed to send invoice: ${errorText}`, response.status);
    }

    const data = await response.json();
    console.log(`[Zoho] Invoice marked as sent successfully`);
    return data.invoice;
  }
}

// Singleton instance
let zohoClientInstance: ZohoClient | null = null;

export function getZohoClient(): ZohoClient {
  if (!zohoClientInstance) {
    zohoClientInstance = new ZohoClient();
  }
  return zohoClientInstance;
}


