import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import QuotationsClient from './QuotationsClient';

export default async function QuotationsPage() {
  // Auth check is handled by AuthenticatedLayout in parent layout
  const session = await auth();
  const sessionHelper = new SessionHelper(session!);
  const membership = sessionHelper.getMembership()!;

  return (
    <QuotationsClient
      orgId={membership.orgId}
      userRole={membership.role}
    />
  );
}


