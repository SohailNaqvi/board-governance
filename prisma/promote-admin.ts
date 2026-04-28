/**
 * Promote an existing seeded user to a working login admin.
 *
 * Sets passwordHash and mustChangePassword on a user that was created by
 * prior seed scripts (before Auth-1 added the password column). The user
 * can then log in via /login and will be forced to change their password.
 *
 * Usage:
 *   npx tsx prisma/promote-admin.ts                          # defaults to sysadmin@university.edu
 *   npx tsx prisma/promote-admin.ts user@example.com         # target a specific email
 *
 * Hard rules (same as bootstrap-admin.ts):
 *   - Password is printed ONCE to stdout on success.
 *   - Password is NEVER logged elsewhere — not in error handlers, not in catch blocks.
 *   - If the update fails, the password is NOT printed.
 *   - If the user already has a passwordHash, the script refuses to overwrite.
 *
 * Self-contained: all dependencies are inlined (no cross-package imports)
 * to ensure the script runs on Render Shell without app build artifacts.
 *
 * Requires: DATABASE_URL in environment, prisma generate already run.
 */

import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const DEFAULT_EMAIL = "sysadmin@university.edu";

/**
 * Argon2id configuration matching OWASP 2024 recommendations.
 * Same params as bootstrap-admin.ts and apps/web/src/lib/auth/password.ts.
 */
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
};

async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, ARGON2_OPTIONS);
}

/**
 * Generate a secure random password.
 * 20 characters: mix of upper, lower, digits, and symbols.
 */
function generateSecurePassword(length: number = 20): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";

  const all = uppercase + lowercase + digits + symbols;

  // Ensure at least one char of each type
  const chars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  // Fill the rest randomly
  for (let i = chars.length; i < length; i++) {
    chars.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Shuffle using Fisher-Yates
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

async function main() {
  const targetEmail = process.argv[2] ?? DEFAULT_EMAIL;
  const prisma = new PrismaClient();

  try {
    // Look up the user
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      console.error(`No user found with email: ${targetEmail}`);
      process.exit(1);
    }

    if (user.deactivatedAt) {
      console.error(`User ${targetEmail} is deactivated. Cannot promote.`);
      process.exit(1);
    }

    // Refuse to overwrite an existing password hash
    if (user.passwordHash) {
      console.log(`User ${targetEmail} already has a password hash set.`);
      console.log("No changes made. If you need to reset the password, use the change-password flow or a dedicated reset script.");
      return;
    }

    // Generate and hash the password
    const plainPassword = generateSecurePassword();
    const passwordHash = await hashPassword(plainPassword);

    // Update the user — password must not be printed until AFTER this succeeds
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    // Print password ONCE with clear instructions
    console.log("========================================");
    console.log("ADMIN PROMOTED SUCCESSFULLY");
    console.log("========================================");
    console.log(`Email: ${targetEmail}`);
    console.log(`Password: ${plainPassword}`);
    console.log("========================================");
    console.log("IMPORTANT: Save this password now.");
    console.log("You must change it on first login at /login.");
    console.log("========================================");
  } catch (error) {
    // CRITICAL: do NOT log the password in error output
    console.error("Promotion failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
