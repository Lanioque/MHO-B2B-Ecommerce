import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SessionHelper } from "@/lib/auth-helpers";
import BranchesClient from "./BranchesClient";

export default async function Page() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const sessionHelper = new SessionHelper(session);
  const membership = sessionHelper.getMembership();

  if (!membership) {
    redirect("/onboarding");
  }

  return <BranchesClient orgId={membership.orgId} userRole={membership.role} />;
}
