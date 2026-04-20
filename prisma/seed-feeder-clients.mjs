/**
 * Seed FeederClient records with argon2id-hashed API keys.
 *
 * DEV-ONLY: Deterministic test keys are printed to stdout.
 * In production, use scripts/one-time/migrate-argon2id-api-keys.mjs to rotate keys.
 *
 * Run: node prisma/seed-feeder-clients.mjs
 */
import pg from "pg";
import argon2 from "argon2";
const { Client } = pg;

// argon2id work parameters — must match api-key-auth.ts ARGON2_OPTIONS
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
};

const DGSC_TEST_KEY = "dgsc_test_key_2026_argon2id";
const FB_TEST_KEY = "fb_test_key_2026_argon2id";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  await client.connect();
  console.log("Connected to database for FeederClient seeding");

  const dgscKeyHash = await argon2.hash(DGSC_TEST_KEY, ARGON2_OPTIONS);
  const facultyBoardKeyHash = await argon2.hash(FB_TEST_KEY, ARGON2_OPTIONS);

  console.log("=".repeat(60));
  console.log("DEV TEST API KEYS (use these in .env or API clients):");
  console.log(`  DGSC:          ${DGSC_TEST_KEY}`);
  console.log(`  FACULTY_BOARD: ${FB_TEST_KEY}`);
  console.log("=".repeat(60));

  const dgscPermittedTypes = JSON.stringify([
    "SYNOPSIS_APPROVAL",
    "EXAMINER_APPOINTMENT",
    "SUPERVISOR_CHANGE",
    "TOPIC_CHANGE",
    "EXTENSION_CANDIDATURE",
    "COMPREHENSIVE_RESULT",
  ]);

  const facultyBoardPermittedTypes = JSON.stringify([
    "SYNOPSIS_APPROVAL",
    "GEC_CONSTITUTION",
    "EXAMINER_APPOINTMENT",
    "RESULT_APPROVAL",
    "SUPERVISOR_CHANGE",
    "TOPIC_CHANGE",
    "EXTENSION_CANDIDATURE",
    "LEAVE_ABSENCE",
    "RESEARCH_PROJECT_APPROVAL",
    "COMPREHENSIVE_RESULT",
    "COURSEWORK_WAIVER",
    "OTHER",
  ]);

  await client.query(
    `INSERT INTO "FeederClient" (
      "displayName", "feederBodyType", "feederBodyCode", "apiKeyHash",
      "permittedCaseTypes", "active", "rateLimitOverride"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT ("feederBodyCode") DO UPDATE
      SET "apiKeyHash" = EXCLUDED."apiKeyHash", "updatedAt" = now()`,
    [
      "Departmental Graduate Studies Committee",
      "DGSC",
      "DGSC",
      dgscKeyHash,
      dgscPermittedTypes,
      true,
      60,
    ]
  );
  console.log("Seeded DGSC FeederClient");

  await client.query(
    `INSERT INTO "FeederClient" (
      "displayName", "feederBodyType", "feederBodyCode", "apiKeyHash",
      "permittedCaseTypes", "active", "rateLimitOverride"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT ("feederBodyCode") DO UPDATE
      SET "apiKeyHash" = EXCLUDED."apiKeyHash", "updatedAt" = now()`,
    [
      "Faculty Board of Studies",
      "FACULTY_BOARD",
      "FACULTY_BOARD",
      facultyBoardKeyHash,
      facultyBoardPermittedTypes,
      true,
      60,
    ]
  );
  console.log("Seeded Faculty Board FeederClient");

  console.log("FeederClient seeding complete!");
  await client.end();
}

seed().catch((e) => {
  console.error("Seeding failed:", e);
  process.exit(1);
});
