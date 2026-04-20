/**
 * Migration: Replace SHA-256 API key hashes with argon2id hashes.
 *
 * Strategy (pre-production):
 *   1. Generate new raw API keys for each feeder client.
 *   2. Hash them with argon2id.
 *   3. UPDATE the apiKeyHash column in-place.
 *   4. Print the new raw keys to stdout so developers can update .env files.
 *
 * This invalidates all previously issued keys. Acceptable in pre-production;
 * in production you would add a new column and run a dual-read migration.
 *
 * Run: node prisma/migrate-argon2id-api-keys.mjs
 */
import pg from "pg";
import argon2 from "argon2";
import { randomBytes } from "crypto";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// argon2id work parameters — must match api-key-auth.ts ARGON2_OPTIONS
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
};

function generateAPIKey(prefix) {
  // 32 random bytes → 64 hex chars, with human-readable prefix
  return `${prefix}_${randomBytes(32).toString("hex")}`;
}

async function migrate() {
  await client.connect();
  console.log("Connected to database");

  const result = await client.query(
    `SELECT id, "feederBodyCode", "displayName" FROM "FeederClient"`
  );

  if (result.rows.length === 0) {
    console.log("No FeederClient records found. Nothing to migrate.");
    await client.end();
    return;
  }

  console.log(`\nFound ${result.rows.length} feeder client(s). Rotating keys...\n`);
  console.log("=".repeat(80));
  console.log("NEW API KEYS (save these — they cannot be recovered from the hash)");
  console.log("=".repeat(80));

  for (const row of result.rows) {
    const rawKey = generateAPIKey(row.feederBodyCode.toLowerCase());
    const hash = await argon2.hash(rawKey, ARGON2_OPTIONS);

    await client.query(
      `UPDATE "FeederClient" SET "apiKeyHash" = $1, "updatedAt" = now() WHERE id = $2`,
      [hash, row.id]
    );

    console.log(`\n  Client:  ${row.displayName} (${row.feederBodyCode})`);
    console.log(`  Raw Key: ${rawKey}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("Migration complete. All API key hashes are now argon2id.");
  console.log("Update your .env / client configuration with the new keys above.");
  console.log("=".repeat(80) + "\n");

  await client.end();
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
