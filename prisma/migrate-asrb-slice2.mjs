import pg from "pg";
import argon2 from "argon2";
import { randomBytes } from "crypto";
const { Client } = pg;

// argon2id work parameters — must match api-key-auth.ts ARGON2_OPTIONS
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
};

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  await client.connect();
  console.log("Connected to database");

  // Create ASRB Enums
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "ASRBCaseStatus" AS ENUM (
        'RECEIVED', 'COMPLIANCE_EVALUATED', 'VETTING', 'READY_FOR_AGENDA',
        'ON_AGENDA', 'DECIDED', 'CLOSED', 'RETURNED', 'HELD', 'WITHDRAWN', 'URGENT_CIRCULATION', 'DEFERRED'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created ASRBCaseStatus enum");

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "CaseType" AS ENUM (
        'SYNOPSIS_APPROVAL', 'GEC_CONSTITUTION', 'EXAMINER_APPOINTMENT', 'RESULT_APPROVAL',
        'SUPERVISOR_CHANGE', 'TOPIC_CHANGE', 'EXTENSION_CANDIDATURE', 'LEAVE_ABSENCE',
        'RESEARCH_PROJECT_APPROVAL', 'COMPREHENSIVE_RESULT', 'COURSEWORK_WAIVER', 'OTHER'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created CaseType enum");

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "CaseUrgency" AS ENUM ('NORMAL', 'URGENT_CIRCULATION');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created CaseUrgency enum");

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "FeederBodyType" AS ENUM ('DGSC', 'FACULTY_BOARD');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created FeederBodyType enum");

  // Create FeederClient table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "FeederClient" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "displayName" TEXT NOT NULL,
      "feederBodyType" "FeederBodyType" NOT NULL,
      "feederBodyCode" TEXT NOT NULL UNIQUE,
      "apiKeyHash" TEXT NOT NULL,
      "permittedCaseTypes" TEXT NOT NULL,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "rateLimitOverride" INTEGER,
      "lastUsedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "FeederClient_pkey" PRIMARY KEY ("id")
    )
  `);
  console.log("Created FeederClient table");

  await client.query(`CREATE INDEX IF NOT EXISTS "FeederClient_apiKeyHash_idx" ON "FeederClient" ("apiKeyHash")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "FeederClient_feederBodyCode_idx" ON "FeederClient" ("feederBodyCode")`);

  // Create ASRBCase table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "ASRBCase" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "caseType" "CaseType" NOT NULL,
      "status" "ASRBCaseStatus" NOT NULL DEFAULT 'RECEIVED',
      "urgency" "CaseUrgency" NOT NULL DEFAULT 'NORMAL',
      "receiptReference" TEXT NOT NULL UNIQUE,
      "idempotencyKey" TEXT NOT NULL,
      "feederClientId" TEXT NOT NULL,
      "feederBodyType" "FeederBodyType" NOT NULL,
      "feederBodyCode" TEXT NOT NULL,
      "feederResolutionBody" TEXT,
      "feederResolutionNum" TEXT,
      "feederResolutionDate" TIMESTAMPTZ,
      "studentRegNo" TEXT,
      "supervisorEmpId" TEXT,
      "programmeCode" TEXT,
      "casePayload" TEXT NOT NULL,
      "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "lastTransitionAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "ASRBCase_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ASRBCase_feederClientId_idempotencyKey_key" UNIQUE ("feederClientId", "idempotencyKey"),
      CONSTRAINT "ASRBCase_feederClientId_fkey" FOREIGN KEY ("feederClientId")
        REFERENCES "FeederClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  console.log("Created ASRBCase table");

  await client.query(`CREATE INDEX IF NOT EXISTS "ASRBCase_status_idx" ON "ASRBCase" ("status")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ASRBCase_caseType_idx" ON "ASRBCase" ("caseType")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ASRBCase_feederClientId_idx" ON "ASRBCase" ("feederClientId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ASRBCase_receiptReference_idx" ON "ASRBCase" ("receiptReference")`);

  // Create CaseAttachment table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "CaseAttachment" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "caseId" TEXT NOT NULL,
      "filename" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "sizeBytes" INTEGER NOT NULL,
      "docType" TEXT NOT NULL,
      "storageRef" TEXT,
      "uploadToken" TEXT UNIQUE,
      "uploadExpiry" TIMESTAMPTZ,
      "uploaded" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "CaseAttachment_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "CaseAttachment_caseId_fkey" FOREIGN KEY ("caseId")
        REFERENCES "ASRBCase"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  console.log("Created CaseAttachment table");

  await client.query(`CREATE INDEX IF NOT EXISTS "CaseAttachment_caseId_idx" ON "CaseAttachment" ("caseId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "CaseAttachment_uploadToken_idx" ON "CaseAttachment" ("uploadToken")`);

  // Create CaseAuditEvent table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "CaseAuditEvent" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "caseId" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "actorId" TEXT NOT NULL,
      "payloadHash" TEXT NOT NULL,
      "details" TEXT,
      "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "CaseAuditEvent_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "CaseAuditEvent_caseId_fkey" FOREIGN KEY ("caseId")
        REFERENCES "ASRBCase"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  console.log("Created CaseAuditEvent table");

  await client.query(`CREATE INDEX IF NOT EXISTS "CaseAuditEvent_caseId_idx" ON "CaseAuditEvent" ("caseId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "CaseAuditEvent_eventType_idx" ON "CaseAuditEvent" ("eventType")`);

  // Seed FeederClient records with argon2id-hashed API keys.
  // DEV-ONLY: deterministic test keys are printed to stdout.
  // In production, use randomly generated keys via migrate-argon2id-api-keys.mjs.
  const DGSC_TEST_KEY = "dgsc_test_key_2026_argon2id";
  const FB_TEST_KEY = "fb_test_key_2026_argon2id";

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

  await client.query(`
    INSERT INTO "FeederClient" (
      "displayName", "feederBodyType", "feederBodyCode", "apiKeyHash", 
      "permittedCaseTypes", "active", "rateLimitOverride"
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7
    )
    ON CONFLICT ("feederBodyCode") DO NOTHING
  `, [
    "Departmental Graduate Studies Committee",
    "DGSC",
    "DGSC",
    dgscKeyHash,
    dgscPermittedTypes,
    true,
    60
  ]);
  console.log("Seeded DGSC FeederClient");

  await client.query(`
    INSERT INTO "FeederClient" (
      "displayName", "feederBodyType", "feederBodyCode", "apiKeyHash", 
      "permittedCaseTypes", "active", "rateLimitOverride"
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7
    )
    ON CONFLICT ("feederBodyCode") DO NOTHING
  `, [
    "Faculty Board of Studies",
    "FACULTY_BOARD",
    "FACULTY_BOARD",
    facultyBoardKeyHash,
    facultyBoardPermittedTypes,
    true,
    60
  ]);
  console.log("Seeded Faculty Board FeederClient");

  console.log("\nASRB Slice 2 migration complete!");
  await client.end();
}

migrate().catch(e => { console.error(e); process.exit(1); });
