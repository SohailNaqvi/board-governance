/**
 * E2E auth helper — creates a valid session cookie for Playwright tests.
 *
 * Uses the same JWT signing as the app's session module.
 * The admin user has SYSTEM_ADMINISTRATOR role, which grants
 * ASRB_MANAGE_RULES permission required by all compliance API routes.
 */

import { SignJWT } from "jose";
import { PrismaClient, UserRole } from "@prisma/client";
import type { BrowserContext } from "@playwright/test";
import * as argon2 from "argon2";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * Argon2id configuration matching OWASP 2024 recommendations.
 */
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
};

export const ADMIN_USER = {
  id: "e2e-admin-id",
  email: "sysadmin@university.edu",
  name: "E2E Admin",
  role: UserRole.SYSTEM_ADMINISTRATOR,
};

export const TEST_USER = {
  id: "e2e-test-id",
  email: "test@university.edu",
  name: "E2E Test User",
  role: UserRole.AUTHORIZED_PROPOSER,
  password: "TestPassword123",
};

async function createSessionJWT(
  userId: string,
  email: string,
  name: string,
  role: string,
  mustChangePassword: boolean = false
): Promise<string> {
  return new SignJWT({
    userId,
    email,
    name,
    role,
    mustChangePassword,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

export async function createAdminSession(): Promise<string> {
  return createSessionJWT(
    ADMIN_USER.id,
    ADMIN_USER.email,
    ADMIN_USER.name,
    ADMIN_USER.role,
    false
  );
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

/**
 * Seed a test user in the database with a known password.
 * Returns the user object for use in tests.
 */
export async function seedTestUser(): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
  password: string;
}> {
  const prisma = new PrismaClient();

  try {
    // Delete if exists (clean state for tests)
    await prisma.user.deleteMany({
      where: { email: TEST_USER.email },
    });

    // Hash password
    const passwordHash = await argon2.hash(TEST_USER.password, ARGON2_OPTIONS);

    // Create test user
    await prisma.user.create({
      data: {
        id: TEST_USER.id,
        email: TEST_USER.email,
        name: TEST_USER.name,
        role: TEST_USER.role,
        passwordHash,
        mustChangePassword: false,
      },
    });

    return TEST_USER;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Seed the bootstrap admin user (for testing bootstrap flow).
 * Returns password for use in tests.
 */
export async function seedBootstrapAdmin(
  password: string = "InitialAdminPassword123"
): Promise<{ email: string; password: string }> {
  const prisma = new PrismaClient();

  try {
    // Delete if exists (clean state for tests)
    await prisma.user.deleteMany({
      where: { email: "admin@university-dss.local" },
    });

    // Hash password
    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

    // Create bootstrap admin
    await prisma.user.create({
      data: {
        email: "admin@university-dss.local",
        name: "System Administrator",
        role: UserRole.SYSTEM_ADMINISTRATOR,
        passwordHash,
        mustChangePassword: true,
      },
    });

    return {
      email: "admin@university-dss.local",
      password,
    };
  } finally {
    await prisma.$disconnect();
  }
}
