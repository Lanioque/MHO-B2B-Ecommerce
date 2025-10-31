'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LayoutDashboard, Package, FileText, ShoppingCart, Building2, BarChart3, Receipt, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const manageNav = [
  { href: '/products', label: 'Products', icon: Package },
  { href: '/quotations', label: 'Quotations', icon: FileText },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/branches', label: 'Branches', icon: Building2 },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Initialize from localStorage and set CSS var for content padding
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sidebarHidden') : null;
    const initiallyCollapsed = stored === '1';
    setCollapsed(initiallyCollapsed);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', initiallyCollapsed ? '3.5rem' : '14rem');
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarHidden', next ? '1' : '0');
    }
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', next ? '3.5rem' : '14rem');
    }
  };

  return (
    <div className="relative">
      {/* Mobile toggle */}
      <div className="md:hidden sticky top-16 z-40 bg-white/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <span className="text-sm font-medium">Menu</span>
          <Button size="sm" variant="outline" onClick={() => setOpen((s) => !s)}>
            {open ? 'Close' : 'Open'}
          </Button>
        </div>
      </div>

      <aside
        className={cn(
          'hidden md:block md:fixed md:left-0 md:top-16 md:h-[calc(100vh-5rem)] transition-all duration-300',
          open ? 'block' : 'md:block'
        )}
        style={{ width: 'var(--sidebar-width, 14rem)' }}
      >
        <div className="h-full border-r border-gray-200/60 bg-gradient-to-b from-white/90 to-gray-50/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-md rounded-none md:rounded-r-xl ring-1 ring-gray-100/40">
          <ScrollArea className="h-full">
            <div className="p-4 border-b">
              <div className={cn('flex items-center gap-3', collapsed ? 'justify-center' : '')}>
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold grid place-items-center shadow">
                  M
                </div>
                {!collapsed && (
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Menu</div>
                    <div className="text-[11px] text-gray-500">Quick navigation</div>
                  </div>
                )}
              </div>
            </div>
            <nav className="p-3 space-y-5">
              <div>
                {!collapsed && <div className="px-2 pb-2 text-[11px] uppercase tracking-wide text-gray-500">Overview</div>}
                <ul className={cn('space-y-1', collapsed ? 'px-1' : '')}>
                  {mainNav.map((item) => (
                    <li key={item.href} className={collapsed ? 'flex justify-center' : ''}>
                      <SidebarLink href={item.href} label={item.label} icon={item.icon} activePath={pathname} collapsed={collapsed} />
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {!collapsed && <div className="px-2 pb-2 text-[11px] uppercase tracking-wide text-gray-500">Management</div>}
                <ul className={cn('space-y-1', collapsed ? 'px-1' : '')}>
                  {manageNav.map((item) => (
                    <li key={item.href} className={collapsed ? 'flex justify-center' : ''}>
                      <SidebarLink href={item.href} label={item.label} icon={item.icon} activePath={pathname} collapsed={collapsed} />
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </ScrollArea>
        </div>
      </aside>

      {/* Collapse/expand toggle button */}
  <Button
        size="sm"
        variant="ghost"
        className="hidden md:inline-flex fixed top-20 left-2 z-50 h-9 w-9 rounded-full shadow-md bg-white/90 backdrop-blur ring-1 ring-gray-200 hover:bg-white transition-all duration-300"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function SidebarLink({ href, label, icon: Icon, activePath, collapsed }: { href: string; label: string; icon: any; activePath?: string | null; collapsed?: boolean }) {
  const active = activePath === href || (href !== '/' && (activePath || '').startsWith(href));
  return (
    <Link href={href} className="block">
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all hover:translate-x-[1px]',
                active ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 ring-1 ring-blue-100' : 'hover:bg-gray-50 text-gray-700'
              )}
            >
              <div className={cn('h-8 w-8 grid place-items-center rounded-md border', active ? 'bg-white text-blue-700 border-blue-100' : 'bg-white text-gray-600 border-gray-200')}>
                <Icon className={cn('h-4 w-4')} />
              </div>
              {!collapsed && <span className="font-medium">{label}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="hidden md:block">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Link>
  );
}


