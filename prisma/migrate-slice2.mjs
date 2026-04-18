import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  await client.connect();
  console.log("Connected to database");

  // Add MeetingStatus enum
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "MeetingStatus" AS ENUM (
        'DRAFT', 'SCHEDULED', 'CALL_ISSUED', 'SUBMISSIONS_OPEN',
        'SUBMISSIONS_CLOSED', 'AGENDA_APPROVED', 'PAPERS_CIRCULATED',
        'IN_SESSION', 'CONCLUDED', 'MINUTES_DRAFTED', 'MINUTES_CONFIRMED'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created MeetingStatus enum");

  // Add APCEEventStatus enum
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "APCEEventStatus" AS ENUM ('PENDING', 'TRIGGERED', 'COMPLETED', 'SKIPPED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created APCEEventStatus enum");

  // Add new columns to MeetingCalendar
  const newCols = [
    { name: "title", type: "TEXT" },
    { name: "status", type: '"MeetingStatus" DEFAULT \'DRAFT\'' },
    { name: '"onlineMeetingLink"', type: "TEXT" },
    { name: "quorum", type: "TEXT" },
    { name: '"callNoticeAt"', type: "TIMESTAMPTZ" },
    { name: '"cutoffAt"', type: "TIMESTAMPTZ" },
    { name: '"vcApprovalDueAt"', type: "TIMESTAMPTZ" },
    { name: '"circulationAt"', type: "TIMESTAMPTZ" },
    { name: '"queryCloseAt"', type: "TIMESTAMPTZ" },
    { name: '"concludedAt"', type: "TIMESTAMPTZ" },
    { name: '"minutesDraftDueAt"', type: "TIMESTAMPTZ" },
    { name: '"minutesConfirmAt"', type: "TIMESTAMPTZ" },
    { name: '"createdBy"', type: "TEXT" },
  ];

  for (const col of newCols) {
    try {
      await client.query(`ALTER TABLE "MeetingCalendar" ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      console.log(`  Added column ${col.name}`);
    } catch (e) {
      console.log(`  Column ${col.name} already exists or error: ${e.message}`);
    }
  }

  // Add indexes on MeetingCalendar
  await client.query(`CREATE INDEX IF NOT EXISTS "MeetingCalendar_status_idx" ON "MeetingCalendar" ("status")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "MeetingCalendar_meetingDate_idx" ON "MeetingCalendar" ("meetingDate")`);

  // Create APCEEvent table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "APCEEvent" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "meetingCalendarId" TEXT NOT NULL,
      "eventCode" TEXT NOT NULL,
      "eventName" TEXT NOT NULL,
      "scheduledAt" TIMESTAMPTZ NOT NULL,
      "triggeredAt" TIMESTAMPTZ,
      "status" "APCEEventStatus" NOT NULL DEFAULT 'PENDING',
      "offsetDays" INTEGER NOT NULL,
      "description" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "APCEEvent_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "APCEEvent_meetingCalendarId_eventCode_key" UNIQUE ("meetingCalendarId", "eventCode"),
      CONSTRAINT "APCEEvent_meetingCalendarId_fkey" FOREIGN KEY ("meetingCalendarId")
        REFERENCES "MeetingCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  console.log("Created APCEEvent table");

  await client.query(`CREATE INDEX IF NOT EXISTS "APCEEvent_meetingCalendarId_idx" ON "APCEEvent" ("meetingCalendarId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "APCEEvent_eventCode_idx" ON "APCEEvent" ("eventCode")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "APCEEvent_status_idx" ON "APCEEvent" ("status")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "APCEEvent_scheduledAt_idx" ON "APCEEvent" ("scheduledAt")`);

  // Create InAppNotification table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "InAppNotification" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "recipientRole" "UserRole" NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'info',
      "read" BOOLEAN NOT NULL DEFAULT false,
      "readAt" TIMESTAMPTZ,
      "apceEventId" TEXT,
      "meetingCalendarId" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "InAppNotification_apceEventId_fkey" FOREIGN KEY ("apceEventId")
        REFERENCES "APCEEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);
  console.log("Created InAppNotification table");

  await client.query(`CREATE INDEX IF NOT EXISTS "InAppNotification_recipientRole_idx" ON "InAppNotification" ("recipientRole")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "InAppNotification_read_idx" ON "InAppNotification" ("read")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "InAppNotification_createdAt_idx" ON "InAppNotification" ("createdAt")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "InAppNotification_apceEventId_idx" ON "InAppNotification" ("apceEventId")`);

  console.log("\nSlice 2 migration complete!");
  await client.end();
}

migrate().catch(e => { console.error(e); process.exit(1); });
