import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const sessionHelper = new SessionHelper(session);
  const membership = sessionHelper.getMembership();

  if (!membership) {
    redirect('/onboarding');
  }

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


