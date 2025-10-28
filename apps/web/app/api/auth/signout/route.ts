import { signOut } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  await signOut({ redirectTo: "/" });
  return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3001"));
}

