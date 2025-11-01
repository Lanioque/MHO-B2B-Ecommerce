import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  // Auth check is handled by AuthenticatedLayout in parent layout
  const session = await auth();
  const sessionHelper = new SessionHelper(session!);
  const membership = sessionHelper.getMembership()!;

  // Check role-based access
  if (membership.role === 'CUSTOMER') {
    redirect('/dashboard');
  }

  return (
    <AnalyticsClient
      orgId={membership.orgId}
      userRole={membership.role}
      userName={session.user.name || session.user.email || 'User'}
    />
  );
}


