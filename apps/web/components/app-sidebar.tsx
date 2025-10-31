"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Building2,
  BarChart3,
  Receipt,
  Settings,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation items - Overview section
const overviewNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
]

// Navigation items - Management section
const managementNav = [
  {
    title: "Products",
    url: "/products",
    icon: Package,
  },
  {
    title: "Quotations",
    url: "/quotations",
    icon: FileText,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Branches",
    url: "/dashboard/branches",
    icon: Building2,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: Receipt,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Get organization data from session
  const membership = session?.user?.memberships?.[0]
  const orgName = "MHO Platform" // Can be enhanced later to fetch actual org name
  const orgPlan = membership?.role || "Member"

  // Get user data
  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""

  // Mark active items
  const overviewNavWithActive = overviewNav.map((item) => ({
    ...item,
    isActive: pathname === item.url || (item.url !== "/" && pathname?.startsWith(item.url)),
  }))

  const managementNavWithActive = managementNav.map((item) => ({
    ...item,
    isActive: pathname === item.url || (item.url !== "/" && pathname?.startsWith(item.url)),
  }))

  // Create team/organization data
  const teams = membership
    ? [
        {
          name: orgName,
          logo: Building2,
          plan: orgPlan,
        },
      ]
    : []

  // Create user data
  const user = {
    name: userName,
    email: userEmail,
    avatar: "", // You can add avatar URL later
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={overviewNavWithActive} label="Overview" />
        <NavMain items={managementNavWithActive} label="Management" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
