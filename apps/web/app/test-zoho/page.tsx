"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface ZohoProduct {
  item_id: string;
  item_name: string;
  sku: string;
  description?: string;
  rate: number;
  stock_on_hand: number;
}

interface ApiResponse {
  success?: boolean;
  count?: number;
  products?: ZohoProduct[];
  error?: string;
}

interface Membership {
  id: string;
  orgId: string;
  role: string;
}

interface UserInfo {
  id: string;
  email: string;
  name?: string | null;
  memberships: Membership[];
}

export default function TestZohoPage() {
  const searchParams = useSearchParams();
  const [orgId, setOrgId] = useState("");
  const [zohoOrgId, setZohoOrgId] = useState("806552835");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for success/error messages from URL params
  useEffect(() => {
    const zohoConnected = searchParams.get("zoho_connected");
    if (zohoConnected === "true") {
      // Show success message (will be shown in the UI below)
    }
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  // Load user info on mount
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });
        const result = await response.json();
        if (response.ok && result.user) {
          setUserInfo(result.user);
          // Auto-select first organization if available
          if (result.user.memberships && result.user.memberships.length > 0) {
            setOrgId(result.user.memberships[0].orgId);
          }
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUserInfo();
  }, []);

  const handleFetch = async () => {
    if (!orgId.trim()) {
      setError("Please enter an organization ID");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      let url = `/api/zoho/products?orgId=${encodeURIComponent(orgId)}`;
      if (zohoOrgId.trim()) {
        url += `&zohoOrgId=${encodeURIComponent(zohoOrgId)}`;
      }
      
      const response = await fetch(url, {
        method: "GET",
        credentials: "include", // Important for cookies
      });

      const result: ApiResponse = await response.json();
      
      if (!response.ok) {
        setError(result.error || `HTTP ${response.status}: ${response.statusText}`);
      } else {
        setData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/zoho/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgId: orgId,
          zohoOrgId: zohoOrgId,
        }),
        credentials: "include",
      });

      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || `HTTP ${response.status}: ${response.statusText}`);
      } else {
        setData({
          success: true,
          count: result.totalFetched,
          products: [],
        });
        toast.success(`Sync completed: ${result.synced} products synced, ${result.errors} errors`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Test Zoho Products API</h1>
        <p className="text-sm text-gray-500 mt-1">Test the Zoho products integration</p>
      </div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test API Endpoint</CardTitle>
            <CardDescription>
              Fetch products from your Zoho Inventory account. Just enter your Zoho organization ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Success message from OAuth */}
            {searchParams.get("zoho_connected") === "true" && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                <p className="font-semibold">✅ Zoho Connected Successfully!</p>
                <p className="text-sm mt-1">You can now fetch products from your Zoho account.</p>
              </div>
            )}

            {loadingUser ? (
              <div className="text-sm text-gray-500 py-4">Loading your account...</div>
            ) : !userInfo?.memberships || userInfo.memberships.length === 0 ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p className="font-semibold">No Organizations Found</p>
                <p className="text-sm mt-1">You need to create an organization first. Please go back to the dashboard.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
                  <p className="text-sm">
                    Using organization: <span className="font-mono font-semibold">{orgId}</span>
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md">
                  <p className="font-semibold mb-2">⚠️ Connect to Zoho First</p>
                  <p className="text-sm mb-3">
                    Before fetching products, you need to authorize access to your Zoho account.
                  </p>
                  <Button
                    onClick={() => window.location.href = `/api/zoho/oauth/start?orgId=${orgId}`}
                    variant="outline"
                    className="w-full"
                  >
                    Connect to Zoho
                  </Button>
                  <p className="text-xs mt-2 text-amber-600">
                    This will redirect you to Zoho to authorize access. After authorization, you'll be redirected back here.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="zohoOrgId" className="block text-sm font-medium">
                    Zoho Organization ID
                  </label>
                  <input
                    id="zohoOrgId"
                    type="text"
                    value={zohoOrgId}
                    onChange={(e) => setZohoOrgId(e.target.value)}
                    placeholder="e.g., 806552835"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-500">
                    Your Zoho Inventory organization ID (e.g., 806552835)
                  </p>
                </div>
              </>
            )}

            {userInfo?.memberships && userInfo.memberships.length > 0 && (
              <div className="space-y-2">
                <Button
                  onClick={handleFetch}
                  disabled={loading || !orgId.trim() || !zohoOrgId.trim()}
                  className="w-full"
                >
                  {loading ? "Fetching..." : "Fetch Products"}
                </Button>
                <Button
                  onClick={handleSync}
                  disabled={loading || !zohoOrgId.trim()}
                  variant="default"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Syncing to DB..." : "Sync to Database"}
                </Button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
                {error.includes("No Zoho connection found") && (
                  <div className="mt-3 pt-3 border-t border-red-300">
                    <p className="text-sm mb-2">You need to connect your organization to Zoho first.</p>
                    <Button
                      onClick={() => window.location.href = `/api/zoho/oauth/start?orgId=${orgId}`}
                      className="w-full"
                      variant="outline"
                    >
                      Connect to Zoho
                    </Button>
                  </div>
                )}
              </div>
            )}

            {data && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  <p className="font-semibold">Success!</p>
                  <p className="text-sm mt-1">
                    Fetched {data.count || 0} products
                  </p>
                </div>

                {/* JSON Response */}
                <div>
                  <h3 className="text-sm font-medium mb-2">API Response:</h3>
                  <pre className="bg-gray-100 border border-gray-300 rounded-md p-4 overflow-x-auto text-sm">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>

                {/* Products List */}
                {data.products && data.products.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Products ({data.products.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.products.map((product) => (
                        <Card key={product.item_id}>
                          <CardHeader>
                            <CardTitle className="text-base">{product.item_name}</CardTitle>
                            <CardDescription>SKU: {product.sku}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">ID:</span> {product.item_id}
                              </div>
                              <div>
                                <span className="font-medium">Price:</span> ${product.rate?.toFixed(2) || "0.00"}
                              </div>
                              <div>
                                <span className="font-medium">Stock:</span> {product.stock_on_hand || 0}
                              </div>
                              {product.description && (
                                <div>
                                  <span className="font-medium">Description:</span>{" "}
                                  <p className="text-gray-600 truncate">{product.description}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold">Endpoint:</h4>
                <code className="bg-gray-100 px-2 py-1 rounded">GET /api/zoho/products</code>
              </div>
              <div>
                <h4 className="font-semibold">Query Parameters:</h4>
                <ul className="list-disc list-inside ml-2">
                  <li><code>orgId</code> - Your organization UUID (required)</li>
                  <li><code>zohoOrgId</code> - Zoho Inventory organization ID (optional)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Example URL:</h4>
                <code className="bg-gray-100 px-2 py-1 rounded block mt-1">
                  /api/zoho/products?orgId=YOUR_ORG_ID&zohoOrgId=806552835
                </code>
              </div>
              <div>
                <h4 className="font-semibold">Authentication:</h4>
                <p className="text-gray-600">
                  This endpoint requires authentication. You must be logged in and have access to the specified organization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    </main>
  );
}

