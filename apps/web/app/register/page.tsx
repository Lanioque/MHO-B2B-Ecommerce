import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  // Check if user is already authenticated
  const session = await auth();
  
  if (session?.user) {
    // User is already logged in, redirect to dashboard
    redirect("/dashboard");
  }

  return <RegisterForm />;
}

