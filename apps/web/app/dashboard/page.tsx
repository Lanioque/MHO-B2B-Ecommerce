import Link from "next/link";
import { auth } from "@/lib/auth";
import { SessionHelper } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
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
  ChevronRight,
  FileText,
  Clock,
  CheckCircle
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

  const orgId = membership.orgId;

  // Fetch recent activity - orders, invoices, and branches created in the last 7 days
  const [recentOrders, recentInvoices, recentBranches] = await Promise.all([
    prisma.order.findMany({
      where: {
        orgId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: true,
        invoices: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        orgId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        order: {
          select: {
            number: true,
            id: true,
          },
        },
      },
    }),
    prisma.branch.findMany({
      where: {
        orgId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);

  // Combine activities into a single list with timestamps
  interface ActivityItem {
    id: string;
    type: 'order' | 'invoice' | 'branch';
    title: string;
    description: string;
    timestamp: Date;
    link: string;
    icon: typeof ShoppingCart;
    color: string;
  }

  // Fetch branches separately for orders that have branchId
  const branchIds = [...new Set(recentOrders.map(o => o.branchId).filter(Boolean))] as string[];
  const branches = branchIds.length > 0
    ? await prisma.branch.findMany({
        where: { id: { in: branchIds } },
      })
    : [];

  const activities: ActivityItem[] = [
    ...recentOrders.map(order => {
      const branch = branches.find(b => b.id === order.branchId);
      return {
        id: order.id,
        type: 'order' as const,
        title: `Order ${order.number}`,
        description: `Created${branch ? ` for ${branch.name}` : ''}${order.customer ? ` by ${order.customer.firstName || order.customer.email}` : ''}`,
        timestamp: order.createdAt,
        link: `/orders/${order.id}`,
        icon: ShoppingCart,
        color: 'text-blue-600',
      };
    }),
    ...recentInvoices.map(invoice => ({
      id: invoice.id,
      type: 'invoice' as const,
      title: `Invoice ${invoice.number}`,
      description: invoice.order ? `For order ${invoice.order.number}` : 'Generated',
      timestamp: invoice.createdAt,
      link: invoice.order ? `/orders/${invoice.order.id}` : '#',
      icon: FileText,
      color: 'text-green-600',
    })),
    ...recentBranches.map(branch => ({
      id: branch.id,
      type: 'branch' as const,
      title: `Branch ${branch.name} created`,
      description: 'New location added',
      timestamp: branch.createdAt,
      link: '/dashboard/branches',
      icon: MapPin,
      color: 'text-orange-600',
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

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
            {activities.length === 0 ? (
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
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <Link
                      key={activity.id}
                      href={activity.link}
                      className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors ${activity.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {activity.title}
                          </p>
                          <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
                <div className="pt-4 border-t">
                  <Link href="/orders">
                    <Button variant="outline" className="w-full">
                      View All Activity
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
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
