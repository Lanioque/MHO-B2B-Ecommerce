import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import QuotationsClient from './QuotationsClient';

export default async function QuotationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const sessionHelper = new SessionHelper(session);
  const membership = sessionHelper.getMembership();

  if (!membership) {
    redirect('/onboarding');
  }

  return (
    <QuotationsClient
      orgId={membership.orgId}
      userRole={membership.role}
    />
  );
}


