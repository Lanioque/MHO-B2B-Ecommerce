"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
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
  ChevronDown,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
  const searchParams = useSearchParams()
  const [categories, setCategories] = React.useState<string[]>([])
  const [categoryCounts, setCategoryCounts] = React.useState<Record<string, number>>({})
  const [productsOpen, setProductsOpen] = React.useState(false)
  const isFetchingCategoriesRef = React.useRef(false)

  // Fetch categories with counts
  React.useEffect(() => {
    // Prevent duplicate fetches in React StrictMode
    // Also skip if we already have categories loaded
    if (isFetchingCategoriesRef.current || categories.length > 0) return;
    
    const fetchCategories = async () => {
      isFetchingCategoriesRef.current = true;
      try {
        const response = await fetch('/api/products/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
          
          // Build counts map from categoriesWithCounts if available
          if (data.categoriesWithCounts) {
            const counts: Record<string, number> = {}
            data.categoriesWithCounts.forEach((item: { name: string; count: number }) => {
              counts[item.name] = item.count
            })
            setCategoryCounts(counts)
          }
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      } finally {
        isFetchingCategoriesRef.current = false;
      }
    }
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-open products dropdown if on products page
  React.useEffect(() => {
    if (pathname === '/products') {
      setProductsOpen(true)
    }
  }, [pathname])

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
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarMenu>
            {managementNavWithActive.map((item) => {
              // Special handling for Products with collapsible categories
              if (item.url === '/products') {
                const active = item.isActive ?? (pathname === item.url || pathname?.startsWith(item.url))
                const activeCategory = searchParams?.get('categoryName')
                const Icon = item.icon

                return (
                  <Collapsible key={item.title} asChild open={productsOpen} onOpenChange={setProductsOpen}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton isActive={active} tooltip={item.title}>
                          {Icon && <Icon />}
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="max-h-[50vh] overflow-y-auto scrollbar-hide">
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={active && !activeCategory}>
                                <Link href="/products">
                                  <span>All Products</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            {categories.map((category) => {
                              const categoryActive = activeCategory === category
                              const count = categoryCounts[category]
                              return (
                                <SidebarMenuSubItem key={category}>
                                  <SidebarMenuSubButton asChild isActive={categoryActive} className="min-h-7 h-auto py-2">
                                    <Link href={`/products?categoryName=${encodeURIComponent(category)}`} className="flex items-center justify-between w-full gap-2">
                                      <span className="flex-1 break-words leading-tight">{category}</span>
                                      {count !== undefined && (
                                        <span className="ml-auto flex-shrink-0 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                          {count}
                                        </span>
                                      )}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </div>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }
              // Regular navigation items
              const Icon = item.icon
              const active = item.isActive ?? (pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url)))
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                    <Link href={item.url}>
                      {Icon && <Icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
