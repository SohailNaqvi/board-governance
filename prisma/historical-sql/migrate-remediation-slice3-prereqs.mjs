import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  await client.connect();
  console.log("Connected to database for Slice 3 prerequisites migration");

  // --- New enums ---

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "ASRBMeetingStatus" AS ENUM ('SCHEDULED', 'IN_SESSION', 'CONCLUDED', 'CANCELLED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created ASRBMeetingStatus enum");

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "ASRBMemberRoleType" AS ENUM ('CHAIR', 'INTERNAL', 'EXTERNAL', 'SECRETARY');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created ASRBMemberRoleType enum");

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "ComplianceEvaluationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETE');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created ComplianceEvaluationStatus enum");

  // --- Extend UserRole enum with 7 new ASRB roles ---
  const newRoles = [
    "ASRB_CHAIR",
    "ASRB_SECRETARY",
    "ASRB_INTERNAL_MEMBER",
    "ASRB_EXTERNAL_MEMBER",
    "ASRB_COMPLIANCE_OFFICER",
    "ASRB_VETTING_OFFICER",
    "ASRB_NOTIFICATION_RECIPIENT",
  ];

  for (const role of newRoles) {
    await client.query(`
      DO $$ BEGIN
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS '${role}';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }
  console.log("Extended UserRole enum with 7 new ASRB roles");

  // --- ASRBMeeting table ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS "ASRBMeeting" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "meetingNumber" INTEGER NOT NULL,
      "scheduledAt" TIMESTAMPTZ NOT NULL,
      "status" "ASRBMeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
      "cycleCode" TEXT,
      "concludedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "ASRBMeeting_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ASRBMeeting_meetingNumber_key" UNIQUE ("meetingNumber")
    )
  `);
  console.log("Created ASRBMeeting table");

  await client.query(`CREATE INDEX IF NOT EXISTS "ASRBMeeting_status_idx" ON "ASRBMeeting" ("status")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ASRBMeeting_scheduledAt_idx" ON "ASRBMeeting" ("scheduledAt")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ASRBMeeting_cycleCode_idx" ON "ASRBMeeting" ("cycleCode")`);

  // --- ASRBMember table ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS "ASRBMember" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "fullName" TEXT NOT NULL,
      "designation" TEXT NOT NULL,
      "roleType" "ASRBMemberRoleType" NOT NULL,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "ASRBMember_pkey" PRIMARY KEY ("id")
    )
  `);
  console.log("Created ASRBMember table");

  await client.query(`CREATE INDEX IF NOT EXISTS "ASRBMember_roleType_idx" ON "ASRBMember" ("roleType")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ASRBMember_active_idx" ON "ASRBMember" ("active")`);

  console.log("\nSlice 3 prerequisites migration done!");
  await client.end();
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
