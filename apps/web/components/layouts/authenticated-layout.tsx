import Link from "next/link";
import { auth } from "@/lib/auth";
import { SessionHelper } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ReportIssueDialog } from "@/components/debug/report-issue-dialog";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared authenticated layout with header and footer
 * Used across all authenticated pages
 */
export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const sessionHelper = new SessionHelper(session);
  const membership = sessionHelper.getMembership();

  if (!membership) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">MHO Platform</h1>
                  <p className="text-xs text-gray-500">E-commerce Management</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center space-x-3">
              <ReportIssueDialog />
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
      <div className="flex-grow">
        {children}
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
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

