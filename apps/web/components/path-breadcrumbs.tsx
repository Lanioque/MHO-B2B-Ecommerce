'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

function toTitle(segment: string): string {
  if (!segment) return '';
  return segment
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export function PathBreadcrumbs() {
  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const items = parts.map((part, idx) => ({
    label: toTitle(part),
    href: '/' + parts.slice(0, idx + 1).join('/'),
    isLast: idx === parts.length - 1,
  }));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.length > 0 && <BreadcrumbSeparator />}
        {items.map((it, i) => (
          <span key={it.href} className="flex items-center">
            {!it.isLast ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={it.href}>{it.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {i < items.length - 1 && <BreadcrumbSeparator />}
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>{it.label}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}


