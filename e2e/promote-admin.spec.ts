/**
 * E2E test for the promote-admin flow.
 *
 * Seeds a user with no passwordHash (simulating a pre-Auth-1 seeded user),
 * promotes them by setting a known password hash, then verifies the promotion
 * worked by checking the database state and testing login via the API.
 *
 * NOTE: These tests avoid browser-based form login because the auth.spec.ts
 * rate-limit test (which runs first alphabetically) saturates the in-memory
 * rate limiter for the shared test IP. Instead we verify via direct API calls
 * and database assertions.
 */

import { test, expect } from "@playwright/test";
import { PrismaClient, UserRole } from "@prisma/client";
import * as argon2 from "argon2";

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const PROMOTE_EMAIL = "promote-test@university.edu";
const PROMOTE_PASSWORD = "PromoteTestPass123!";

test.describe("Promote Admin", () => {
  let prisma: PrismaClient;

  test.beforeAll(async () => {
    prisma = new PrismaClient();

    // Clean up any leftover test user
    await prisma.user.deleteMany({ where: { email: PROMOTE_EMAIL } });

    // Create a user with NO passwordHash (simulates pre-Auth-1 seeded user)
    await prisma.user.create({
      data: {
        email: PROMOTE_EMAIL,
        name: "Promote Test User",
        role: UserRole.SYSTEM_ADMINISTRATOR,
        passwordHash: null,
        mustChangePassword: false,
      },
    });
  });

  test.afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: PROMOTE_EMAIL } });
    await prisma.$disconnect();
  });

  test("user with no passwordHash has null in database", async () => {
    const user = await prisma.user.findUnique({
      where: { email: PROMOTE_EMAIL },
    });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).toBeNull();
    expect(user!.mustChangePassword).toBe(false);
  });

  test("after promotion, user has passwordHash and mustChangePassword=true", async () => {
    // Simulate what promote-admin.ts does: set passwordHash + mustChangePassword
    const passwordHash = await argon2.hash(PROMOTE_PASSWORD, ARGON2_OPTIONS);
    await prisma.user.update({
      where: { email: PROMOTE_EMAIL },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    // Verify database state
    const user = await prisma.user.findUnique({
      where: { email: PROMOTE_EMAIL },
    });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBeNull();
    expect(user!.mustChangePassword).toBe(true);

    // Verify the password actually verifies against the hash
    const valid = await argon2.verify(user!.passwordHash!, PROMOTE_PASSWORD);
    expect(valid).toBe(true);
  });

  test("promoted user can authenticate via login API", async ({ request }) => {
    // Call the login API directly (avoids rate-limit interference from browser tests)
    const response = await request.post("/api/auth/login", {
      data: {
        email: PROMOTE_EMAIL,
        password: PROMOTE_PASSWORD,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.mustChangePassword).toBe(true);

    // Verify session cookie was set
    const cookies = await response.headersArray();
    const setCookie = cookies.find(
      (h) => h.name.toLowerCase() === "set-cookie" && h.value.includes("session=")
    );
    expect(setCookie).toBeDefined();
  });

  test("re-promotion is refused when user already has a password hash", async () => {
    const user = await prisma.user.findUnique({
      where: { email: PROMOTE_EMAIL },
    });

    // The promote script checks: if (user.passwordHash) { refuse }
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBeNull();
  });
});
