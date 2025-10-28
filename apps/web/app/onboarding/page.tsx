import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  // Check if user is already authenticated
  const session = await auth();
  
  if (session?.user) {
    // User is already logged in, redirect to dashboard
    redirect("/dashboard");
  }

  return <OnboardingForm email={searchParams.email} />;
}
