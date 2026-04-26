import { PrismaClient, UserRole } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

/**
 * Argon2id configuration matching OWASP 2024 recommendations.
 */
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
};

/**
 * Hash a plaintext password using argon2id.
 */
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
  try {
    // Check if any users exist
    const existingUsers = await prisma.user.findMany();

    if (existingUsers.length > 0) {
      console.log("Database already contains users. Skipping bootstrap admin creation.");
      return;
    }

    // Generate secure password
    const plainPassword = generateSecurePassword();
    const passwordHash = await hashPassword(plainPassword);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@university-dss.local",
        name: "System Administrator",
        role: UserRole.SYSTEM_ADMINISTRATOR,
        passwordHash,
        mustChangePassword: true,
      },
    });

    // Print password ONCE with clear instructions
    console.log("========================================");
    console.log("BOOTSTRAP ADMIN CREATED SUCCESSFULLY");
    console.log("========================================");
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${plainPassword}`);
    console.log("========================================");
    console.log("IMPORTANT: Save this password securely.");
    console.log("The admin user must change this password on first login.");
    console.log("========================================");
  } catch (error) {
    console.error("Error during bootstrap:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
