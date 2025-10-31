import Link from "next/link";
import { auth } from "@/lib/auth";
import { SessionHelper } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ReportIssueDialog } from "@/components/debug/report-issue-dialog";
import { PathBreadcrumbs } from "@/components/path-breadcrumbs";
import SidebarShell from "@/components/layouts/sidebar-shell";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

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
      {/* Main Content with fixed Sidebar on the side */}
      <div className="flex-grow">
        <SidebarShell>
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="hidden md:block">
                  <PathBreadcrumbs />
                </div>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="max-w-screen-2xl mx-auto w-full">
                {children}
              </div>
            </div>
          </SidebarInset>
        </SidebarShell>
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

