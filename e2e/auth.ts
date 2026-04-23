/**
 * E2E auth helper — creates a valid session cookie for Playwright tests.
 *
 * Uses the same JWT signing as the app's session module.
 * The admin user has SYSTEM_ADMINISTRATOR role, which grants
 * ASRB_MANAGE_RULES permission required by all compliance API routes.
 */

import { SignJWT } from "jose";
import type { BrowserContext } from "@playwright/test";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const secret = new TextEncoder().encode(JWT_SECRET);

const ADMIN_PAYLOAD = {
  userId: "e2e-admin-id",
  email: "sysadmin@university.edu",
  name: "E2E Admin",
  role: "SYSTEM_ADMINISTRATOR",
};

export async function createAdminSession(): Promise<string> {
  return new SignJWT(ADMIN_PAYLOAD)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

/**
 * Injects a valid admin session cookie into a Playwright browser context.
 * Call this before navigating to any /admin/* page.
 */
export async function authenticateContext(
  context: BrowserContext,
  baseURL: string
): Promise<void> {
  const token = await createAdminSession();
  const url = new URL(baseURL);
  await context.addCookies([
    {
      name: "session",
      value: token,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
