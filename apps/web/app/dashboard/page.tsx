import Link from "next/link";
import { auth } from "@/lib/auth";
import { SessionHelper } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  MapPin, 
  Zap, 
  TestTube, 
  Building2,
  LayoutDashboard,
  LogOut,
  ChevronRight
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const sessionHelper = new SessionHelper(session);
  const membership = sessionHelper.getMembership();

  if (!membership) {
    redirect("/onboarding");
  }

  const quickActions = [
    {
      title: "Products",
      description: "Manage your inventory and products",
      icon: Package,
      href: "/products",
      color: "bg-blue-500",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Orders",
      description: "View and manage customer orders",
      icon: ShoppingCart,
      href: "/orders",
      color: "bg-green-500",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Customers",
      description: "Manage your customer database",
      icon: Users,
      href: "/customers",
      color: "bg-purple-500",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Branches",
      description: "Manage your business locations",
      icon: MapPin,
      href: "/dashboard/branches",
      color: "bg-orange-500",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      title: "Integrations",
      description: "Connect Zoho and other services",
      icon: Zap,
      href: "/integrations",
      color: "bg-yellow-500",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600"
    },
    {
      title: "Settings",
      description: "Configure your organization",
      icon: Settings,
      href: "/settings",
      color: "bg-gray-500",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600"
    }
  ];

  const devTools = [
    {
      title: "Test Zoho API",
      description: "Test the Zoho products integration",
      icon: TestTube,
      href: "/test-zoho",
    },
    {
      title: "My Organizations",
      description: "View and copy your organization IDs",
      icon: Building2,
      href: "/my-orgs",
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">MHO Platform</h1>
                  <p className="text-xs text-gray-500">E-commerce Management</p>
                </div>
              </div>
            </div>
            <nav className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{session.user.name || "User"}</p>
                  <p className="text-xs text-gray-500">{membership.role}</p>
                </div>
              </div>
              <Link href="/api/auth/signout">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          </div>
          <p className="text-gray-600">Welcome back, {session.user.name || session.user.email}! Here's your overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Products</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Coming soon</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Pending Orders</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Coming soon</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Customers</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Coming soon</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Active Branches</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`${action.iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                        <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="mt-4 group-hover:text-blue-600 transition-colors">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Developer Tools */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Developer Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {devTools.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <Card className="group cursor-pointer hover:shadow-lg transition-all hover:border-gray-300">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
                        <tool.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">{tool.title}</CardTitle>
                        <CardDescription className="text-sm">{tool.description}</CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your platform</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No recent activity to display</p>
              <p className="text-sm text-gray-400 mt-2">Start by adding products or processing orders</p>
              <div className="mt-6 flex gap-3 justify-center">
                <Link href="/products">
                  <Button size="sm" variant="outline">View Products</Button>
                </Link>
                <Link href="/dashboard/branches">
                  <Button size="sm">Manage Branches</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">© 2025 MHO Platform. All rights reserved.</p>
              <p className="text-xs text-gray-400 mt-1">Built with Next.js, Prisma, and modern technology</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/help" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Help Center
              </Link>
              <Link href="/docs" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Documentation
              </Link>
              <Link href="/support" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
