import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SessionHelper } from "@/lib/auth-helpers";
import BranchesClient from "./BranchesClient";

export default async function Page() {
  // Auth check is handled by AuthenticatedLayout in parent layout
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const sessionHelper = new SessionHelper(session);
  const membership = sessionHelper.getMembership();

  if (!membership) {
    redirect('/dashboard');
  }

  return (
    <BranchesClient 
      orgId={membership.orgId} 
      userRole={membership.role}
      userName={session.user.name || session.user.email || "User"}
      userEmail={session.user.email || ""}
    />
  );
}
