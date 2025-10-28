const ZOHO_API_URL = "https://inventory.zoho.eu/api/v1";
const ZOHO_AUTH_URL = "https://accounts.zoho.eu";

export interface ZohoItem {
  item_id: string;
  item_name: string;
  sku: string;
  description?: string;
  rate: number;
  quantity: number;
  stock_on_hand: number;
}

export class ZohoError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "ZohoError";
  }
}

/**
 * Refresh Zoho access token using refresh token
 */
export async function refreshZohoToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(`${ZOHO_AUTH_URL}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new ZohoError(`Failed to refresh token: ${error}`, response.status);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  return data;
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  accessToken?: string,
  expiresAt?: Date
): Promise<string> {
  // If no stored token or it's expired (with 5 min buffer)
  if (!accessToken || !expiresAt) {
    const tokenData = await refreshZohoToken(refreshToken, clientId, clientSecret);
    return tokenData.access_token;
  }

  const now = new Date();
  const expiresAtWithBuffer = new Date(expiresAt);
  expiresAtWithBuffer.setMinutes(expiresAtWithBuffer.getMinutes() - 5);

  if (now > expiresAtWithBuffer) {
    const tokenData = await refreshZohoToken(refreshToken, clientId, clientSecret);
    return tokenData.access_token;
  }

  return accessToken;
}

/**
 * Fetch items from Zoho Inventory with pagination support
 */
export async function fetchZohoItems(
  organizationId: string,
  accessToken: string
): Promise<ZohoItem[]> {
  let allItems: ZohoItem[] = [];
  let page = 1;
  const pageSize = 200; // Zoho API limit per page
  let hasMore = true;

  console.log(`[Zoho] Starting paginated fetch for org: ${organizationId}`);

  while (hasMore) {
    const url = new URL(`${ZOHO_API_URL}/items`);
    url.searchParams.append("organization_id", organizationId);
    url.searchParams.append("page", page.toString());
    url.searchParams.append("per_page", pageSize.toString());

    console.log(`[Zoho] Fetching page ${page}`);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

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

    const data = await response.json() as { items?: ZohoItem[]; page_context?: { has_more_page?: boolean } };
    const items = data.items || [];
    
    allItems = allItems.concat(items);
    
    console.log(`[Zoho] Page ${page}: fetched ${items.length} items (total so far: ${allItems.length})`);

    // Check if there are more pages
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

