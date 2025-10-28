import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  // Check if user is already authenticated
  const session = await auth();
  
  if (session?.user) {
    // User is already logged in, redirect to dashboard
    redirect("/dashboard");
  }

  const callbackUrl = searchParams.callbackUrl || "/dashboard";

  return <LoginForm callbackUrl={callbackUrl} />;
}

