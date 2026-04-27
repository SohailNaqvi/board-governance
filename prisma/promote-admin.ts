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
 * Requires: DATABASE_URL in environment, prisma generate already run.
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword, generateSecurePassword } from "../apps/web/src/lib/auth/password";

const DEFAULT_EMAIL = "sysadmin@university.edu";

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
