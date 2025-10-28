import { prisma } from "./prisma";

// Determine Zoho URLs based on location parameter
const ZOHO_REGION = process.env.ZOHO_REGION || "eu";
const ZOHO_AUTH_URLS = {
  eu: "https://accounts.zoho.eu",
  com: "https://accounts.zoho.com",
  us: "https://accounts.zoho.com",  // US uses .com
  in: "https://accounts.zoho.in",
};
const ZOHO_API_URLS = {
  eu: "https://www.zohoapis.eu/inventory/v1",
  com: "https://www.zohoapis.com/inventory/v1",
  us: "https://www.zohoapis.com/inventory/v1",  // US uses zohoapis.com
  in: "https://www.zohoapis.in/inventory/v1",
};

const ZOHO_AUTH_URL = ZOHO_AUTH_URLS[ZOHO_REGION as keyof typeof ZOHO_AUTH_URLS] || ZOHO_AUTH_URLS.eu;
const ZOHO_API_URL = ZOHO_API_URLS[ZOHO_REGION as keyof typeof ZOHO_API_URLS] || ZOHO_API_URLS.eu;

export interface ZohoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export interface ZohoOrganization {
  organization_id: string;
  name: string;
  contact_name: string;
  currency_code: string;
  currency_symbol: string;
  currency_name: string;
  price_precision: number;
}

export interface ZohoItem {
  item_id: string;
  item_name: string;
  name: string;
  sku: string;
  description?: string;
  rate: number;
  purchase_rate?: number;
  quantity?: number;
  stock_on_hand: number;
  
  // Identifiers
  ean?: string;
  upc?: string;
  isbn?: string;
  part_number?: string;
  
  // Brand and category
  brand?: string;
  manufacturer?: string;
  category_id?: string;
  category_name?: string;
  unit?: string;
  
  // Status
  status?: string;
  source?: string;
  item_type?: string;
  product_type?: string;
  
  // Tax
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number;
  is_taxable?: boolean;
  tax_exemption_id?: string;
  tax_exemption_code?: string;
  tax_category_code?: string;
  tax_category_name?: string;
  
  // Inventory flags
  track_inventory?: boolean;
  can_be_sold?: boolean;
  can_be_purchased?: boolean;
  is_returnable?: boolean;
  track_batch_number?: boolean;
  is_storage_location_enabled?: boolean;
  
  // Zoho CRM
  is_linked_with_zohocrm?: boolean;
  zcrm_product_id?: string;
  purchase_account_id?: string;
  purchase_account_name?: string;
  account_id?: string;
  account_name?: string;
  purchase_description?: string;
  
  // Storefront
  show_in_storefront?: boolean;
  
  // Physical attributes
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  weight_unit?: string;
  dimension_unit?: string;
  
  // Product flags
  is_combo_product?: boolean;
  has_attachment?: boolean;
  
  // Image
  image_name?: string;
  image_type?: string;
  image_document_id?: string;
  
  // Tags
  tags?: string[];
  
  // Timestamps
  created_time?: string;
  last_modified_time?: string;
}

export class ZohoError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "ZohoError";
  }
}

// Build Zoho OAuth authorization URL (read-only scope recommended)
export function getZohoAuthUrl(orgId: string): string {
  const params = new URLSearchParams({
    scope: process.env.ZOHO_SCOPE || "ZohoInventory.items.READ",
    client_id: process.env.ZOHO_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.ZOHO_REDIRECT_URI!,
    access_type: "offline",
    prompt: "consent",
    state: orgId,
  });

  return `${ZOHO_AUTH_URL}/oauth/v2/auth?${params.toString()}`;
}

// Exchange authorization code for access and refresh tokens
export async function exchangeZohoCode(
  code: string
): Promise<ZohoTokenResponse> {
  return exchangeZohoCodeWithRegion(code, ZOHO_AUTH_URL);
}

export async function exchangeZohoCodeWithRegion(
  code: string,
  authUrl: string
): Promise<ZohoTokenResponse> {
  const response = await fetch(`${authUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      redirect_uri: process.env.ZOHO_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new ZohoError(`Failed to exchange code: ${error}`, response.status);
  }

  return response.json();
}

// Refresh access token using refresh token
export async function refreshZohoToken(
  refreshToken: string,
  authUrl?: string
): Promise<ZohoTokenResponse> {
  const endpoint = authUrl || ZOHO_AUTH_URL;
  console.log(`[Zoho] Refreshing token using endpoint: ${endpoint}`);
  
  const response = await fetch(`${endpoint}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new ZohoError(`Failed to refresh token: ${error}`, response.status);
  }

  return response.json();
}

// Get valid access token (refresh if expired)
export async function getValidAccessToken(orgId?: string): Promise<string> {
  // Check if using service account credentials from environment
  if (process.env.ZOHO_ACCESS_TOKEN && process.env.ZOHO_REFRESH_TOKEN) {
    // For service account, always use the token from env
    return process.env.ZOHO_ACCESS_TOKEN;
  }

  // Otherwise, use per-org OAuth credentials from database
  if (!orgId) {
    throw new ZohoError("orgId is required when not using service account credentials");
  }

  const connection = await prisma.zohoConnection.findUnique({
    where: { orgId },
  });

  if (!connection) {
    throw new ZohoError("No Zoho connection found for this organization");
  }

  console.log(`[Zoho] Access token expires at: ${connection.expiresAt} (region: ${connection.region})`);
  
  const now = new Date();
  const expiresAt = new Date(connection.expiresAt);
  expiresAt.setMinutes(expiresAt.getMinutes() - 5);

  if (now > expiresAt) {
    console.log("[Zoho] Access token expired or expiring soon, refreshing...");
    const authUrl = ZOHO_AUTH_URLS[connection.region as keyof typeof ZOHO_AUTH_URLS] || ZOHO_AUTH_URLS.eu;
    const tokenData = await refreshZohoToken(connection.refreshToken, authUrl);

    await prisma.zohoConnection.update({
      where: { orgId },
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? connection.refreshToken,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    });

    return tokenData.access_token;
  }

  return connection.accessToken;
}

// Fetch organizations from Zoho for the authenticated user
export async function fetchZohoOrganizations(
  orgId: string
): Promise<ZohoOrganization[]> {
  const accessToken = await getValidAccessToken(orgId);

  const response = await fetch(`${ZOHO_API_URL}/organizations`, {
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

// Fetch items from Zoho Inventory (read-only) with pagination support
export async function fetchZohoItemsForOrganization(
  orgId?: string,
  zohoOrganizationId?: string
): Promise<ZohoItem[]> {
  const accessToken = await getValidAccessToken(orgId);

  // Determine the Zoho organization ID to use
  let finalZohoOrgId = zohoOrganizationId;
  
  if (!finalZohoOrgId) {
    // If using service account, use the org ID from env
    if (process.env.ZOHO_ORGANIZATION_ID) {
      finalZohoOrgId = process.env.ZOHO_ORGANIZATION_ID;
    } else if (orgId) {
      // Otherwise, fetch from Zoho API
      const organizations = await fetchZohoOrganizations(orgId);
      if (organizations.length === 0) {
        throw new ZohoError("No Zoho organizations found");
      }
      finalZohoOrgId = organizations[0].organization_id;
    } else {
      throw new ZohoError("Zoho organization ID is required");
    }
  }

  // Get region from connection if available
  let region = ZOHO_REGION;
  if (orgId) {
    const connection = await prisma.zohoConnection.findUnique({
      where: { orgId },
      select: { region: true },
    });
    if (connection) {
      region = connection.region;
    }
  }
  
  const apiUrl = ZOHO_API_URLS[region as keyof typeof ZOHO_API_URLS] || ZOHO_API_URLS.eu;
  
  // Fetch all items with pagination
  let allItems: ZohoItem[] = [];
  let page = 1;
  const pageSize = 200; // Zoho API limit per page
  let hasMore = true;

  console.log(`[Zoho] Starting paginated fetch for org: ${finalZohoOrgId} (region: ${region})`);

  while (hasMore) {
    const url = new URL(`${apiUrl}/items`);
    url.searchParams.append("organization_id", finalZohoOrgId);
    url.searchParams.append("page", page.toString());
    url.searchParams.append("per_page", pageSize.toString());

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
      
      // Try to parse error response
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // If not JSON, use the raw error text
        if (errorText) {
          errorMessage += `: ${errorText}`;
        }
      }
      
      throw new ZohoError(errorMessage, response.status);
    }

    const data = await response.json();
    const items = data.items || [];
    
    allItems = allItems.concat(items);
    
    console.log(`[Zoho] Page ${page}: fetched ${items.length} items (total so far: ${allItems.length})`);

    // Check if there are more pages
    // Zoho returns page_info when there are more pages
    if (data.page_context) {
      hasMore = data.page_context.has_more_page === true;
      page++;
    } else {
      // If no page_context, assume no more pages if we got fewer items than requested
      hasMore = items.length === pageSize;
      page++;
    }
  }

  console.log(`[Zoho] Pagination complete! Total items fetched: ${allItems.length}`);
  
  return allItems;
}

// Fetch items from Zoho Inventory - wrapper for backward compatibility
export async function fetchZohoItems(orgId: string): Promise<ZohoItem[]> {
  return fetchZohoItemsForOrganization(orgId);
}

