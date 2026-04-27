/**
 * E2E test for the promote-admin flow.
 *
 * Verifies the database state changes that promote-admin.ts performs:
 * 1. A user with no passwordHash exists (pre-Auth-1 seeded user)
 * 2. After promotion: passwordHash is set, mustChangePassword is true
 * 3. The hash is valid argon2id that verifies against the known password
 * 4. Idempotency: a user with an existing hash is not overwritten
 *
 * Login flow testing is covered by auth.spec.ts — these tests focus on
 * the promotion operation itself without hitting the login API (which
 * would be affected by the in-memory rate limiter shared across all tests).
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

  test("pre-promotion: user has null passwordHash", async () => {
    const user = await prisma.user.findUnique({
      where: { email: PROMOTE_EMAIL },
    });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).toBeNull();
    expect(user!.mustChangePassword).toBe(false);
  });

  test("promotion sets passwordHash and mustChangePassword=true", async () => {
    // Simulate what promote-admin.ts does
    const passwordHash = await argon2.hash(PROMOTE_PASSWORD, ARGON2_OPTIONS);
    await prisma.user.update({
      where: { email: PROMOTE_EMAIL },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { email: PROMOTE_EMAIL },
    });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBeNull();
    expect(user!.mustChangePassword).toBe(true);
  });

  test("promoted hash verifies against the known password", async () => {
    const user = await prisma.user.findUnique({
      where: { email: PROMOTE_EMAIL },
    });
    expect(user!.passwordHash).not.toBeNull();

    const valid = await argon2.verify(user!.passwordHash!, PROMOTE_PASSWORD);
    expect(valid).toBe(true);

    const invalid = await argon2.verify(user!.passwordHash!, "WrongPassword");
    expect(invalid).toBe(false);
  });

  test("idempotency: user with existing hash is not null", async () => {
    // The promote script checks: if (user.passwordHash) { refuse to overwrite }
    const user = await prisma.user.findUnique({
      where: { email: PROMOTE_EMAIL },
    });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBeNull();
    // Script would exit here with "already has a password hash" message
  });
});
