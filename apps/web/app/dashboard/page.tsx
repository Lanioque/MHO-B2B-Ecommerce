import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchSelector } from "@/components/branch-selector";

export default async function DashboardPage() {
  // This page will be protected by the proxy middleware
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">MHO Platform</span>
          </div>
          <nav className="flex items-center space-x-4">
            <BranchSelector />
            <Link href="/api/auth/signout">
              <Button variant="ghost">Sign Out</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your e-commerce platform</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage your inventory and products</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/products">
                <Button className="w-full" variant="outline">
                  View Products
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>View and manage customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/orders">
                <Button className="w-full" variant="outline">
                  View Orders
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Manage your customer database</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/customers">
                <Button className="w-full" variant="outline">
                  View Customers
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings">
                <Button className="w-full" variant="outline">
                  Go to Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Branches</CardTitle>
              <CardDescription>Manage your business locations</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/branches">
                <Button className="w-full" variant="outline">
                  View Branches
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect Zoho and other services</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/integrations">
                <Button className="w-full" variant="outline">
                  View Integrations
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Test Zoho API</CardTitle>
              <CardDescription>Test the Zoho products integration</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/test-zoho">
                <Button className="w-full" variant="outline">
                  Test API
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>My Organizations</CardTitle>
              <CardDescription>View and copy your organization IDs</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/my-orgs">
                <Button className="w-full" variant="outline">
                  View IDs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <p>No recent activity to display</p>
              <p className="text-sm mt-2">Start by adding products or processing orders</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

