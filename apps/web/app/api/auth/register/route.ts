import { NextRequest, NextResponse } from "next/server";
import { createAuthService } from "@/lib/services/auth-service";
import { withErrorHandler } from "@/lib/middleware/error-handler";
import { validateRequestBody } from "@/lib/middleware/validation";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain at least 8 characters with uppercase, lowercase, and number",
  }),
  name: z.string().optional(),
});

/**
 * POST /api/auth/register
 * Register a new user
 * Thin controller - delegates to AuthService
 */
async function registerHandler(req: NextRequest) {
  const authService = createAuthService();

  // Validate request body
  const validated = await validateRequestBody(req, registerSchema);

  // Register user
  const user = await authService.registerUser({
    email: validated.email,
    password: validated.password,
    name: validated.name,
  });

  return NextResponse.json({ user }, { status: 201 });
}

export const POST = withErrorHandler(registerHandler);

