"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  vatNumber?: string;
  role: string;
  membershipId: string;
  createdAt: string;
}

export default function MyOrgsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await fetch("/api/orgs", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch organizations");
        }

        const result = await response.json();
        setOrgs(result.orgs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost">← Back to Dashboard</Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">My Organizations</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading organizations...</p>
          </div>
        )}

        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-700">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && orgs.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                You don't have any organizations yet.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && orgs.length > 0 && (
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle>Your Organization IDs</CardTitle>
                <CardDescription>
                  Use these IDs to make API calls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orgs.map((org) => (
                    <div
                      key={org.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div>
                        <div className="font-semibold text-lg text-gray-900">
                          {org.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Role: {org.role}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded p-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              Organization ID
                            </div>
                            <div className="text-sm font-mono text-gray-900 break-all">
                              {org.id}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(org.id)}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

