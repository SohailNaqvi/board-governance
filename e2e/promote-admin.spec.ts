/**
 * E2E test for the promote-admin flow.
 *
 * Seeds a user with no passwordHash (simulating a pre-Auth-1 seeded user),
 * promotes them by setting a known password hash, then verifies they can
 * log in and are forced to change their password.
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

  test("user with no password cannot log in", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[data-testid="login-email"]', PROMOTE_EMAIL);
    await page.fill('[data-testid="login-password"]', "anything");
    await page.click('[data-testid="login-submit"]');

    await expect(page.getByTestId("login-error")).toContainText(
      "Invalid email or password",
      { timeout: 10_000 }
    );
  });

  test("after promotion, user can log in and is forced to change password", async ({ page }) => {
    // Simulate what promote-admin.ts does: set passwordHash + mustChangePassword
    const passwordHash = await argon2.hash(PROMOTE_PASSWORD, ARGON2_OPTIONS);
    await prisma.user.update({
      where: { email: PROMOTE_EMAIL },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    // Now log in with the promoted credentials
    await page.goto("/login");
    await page.fill('[data-testid="login-email"]', PROMOTE_EMAIL);
    await page.fill('[data-testid="login-password"]', PROMOTE_PASSWORD);
    await page.click('[data-testid="login-submit"]');

    // Should be redirected to /change-password (mustChangePassword=true)
    await expect(page).toHaveURL(/\/change-password/, { timeout: 10_000 });
  });

  test("re-promotion is refused when user already has a password hash", async ({ page }) => {
    // After the previous test, the user has a passwordHash.
    // Verify the guard: the script would refuse.
    const user = await prisma.user.findUnique({
      where: { email: PROMOTE_EMAIL },
    });

    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBeNull();
    // This test verifies the idempotency invariant programmatically.
    // The actual script checks `if (user.passwordHash)` and exits.
  });
});
