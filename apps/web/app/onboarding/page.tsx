import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await auth();
  const { email } = await searchParams;
  
  // If user is authenticated and has organizations, redirect to dashboard
  if (session?.user) {
    const hasOrganizations = session.user.memberships && session.user.memberships.length > 0;
    if (hasOrganizations) {
      redirect("/dashboard");
    }
    // If authenticated but no organizations, allow them to complete onboarding
  }

  return <OnboardingForm email={email || session?.user?.email} />;
}
