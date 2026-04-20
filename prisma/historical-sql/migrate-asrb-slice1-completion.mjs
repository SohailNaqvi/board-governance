import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  await client.connect();
  console.log("Connected to database for ASRB Slice 1 completion migration");

  // Create compliance enums
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "RuleSource" AS ENUM ('HEC', 'UNIVERSITY', 'FACULTY', 'PROGRAMME');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created RuleSource enum");

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "RuleSeverity" AS ENUM ('BLOCKING', 'WARNING', 'INFORMATIONAL');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created RuleSeverity enum");

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "RuleOutcome" AS ENUM ('PASS', 'FAIL', 'WARN', 'NOT_APPLICABLE', 'ERROR');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created RuleOutcome enum");

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'NEEDS_REVIEW', 'NON_COMPLIANT');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("Created ComplianceStatus enum");

  // Create ComplianceRule table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "ComplianceRule" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "ruleId" TEXT NOT NULL,
      "source" "RuleSource" NOT NULL,
      "sourceReference" TEXT,
      "appliesToCaseTypes" TEXT NOT NULL,
      "appliesToProgrammeTypes" TEXT,
      "severity" "RuleSeverity" NOT NULL,
      "evaluation" TEXT NOT NULL,
      "messageTemplate" TEXT NOT NULL,
      "effectiveFrom" TIMESTAMPTZ,
      "effectiveTo" TIMESTAMPTZ,
      "version" INTEGER NOT NULL DEFAULT 1,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "lastEditedBy" TEXT,
      "lastEditedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ComplianceRule_ruleId_version_key" UNIQUE ("ruleId", "version")
    )
  `);
  console.log("Created ComplianceRule table");

  await client.query(`CREATE INDEX IF NOT EXISTS "ComplianceRule_ruleId_idx" ON "ComplianceRule" ("ruleId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ComplianceRule_source_idx" ON "ComplianceRule" ("source")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ComplianceRule_status_idx" ON "ComplianceRule" ("status")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ComplianceRule_effectiveFrom_idx" ON "ComplianceRule" ("effectiveFrom")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ComplianceRule_effectiveTo_idx" ON "ComplianceRule" ("effectiveTo")`);

  // Create ComplianceEvaluation table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "ComplianceEvaluation" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "caseId" TEXT NOT NULL,
      "status" "ComplianceStatus" NOT NULL,
      "evaluatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "rulesVersionSet" TEXT NOT NULL,
      "summary" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "ComplianceEvaluation_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ComplianceEvaluation_caseId_fkey" FOREIGN KEY ("caseId")
        REFERENCES "ASRBCase"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  console.log("Created ComplianceEvaluation table");

  await client.query(`CREATE INDEX IF NOT EXISTS "ComplianceEvaluation_caseId_idx" ON "ComplianceEvaluation" ("caseId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ComplianceEvaluation_status_idx" ON "ComplianceEvaluation" ("status")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ComplianceEvaluation_evaluatedAt_idx" ON "ComplianceEvaluation" ("evaluatedAt")`);

  // Create RuleEvaluation table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "RuleEvaluation" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "evaluationId" TEXT NOT NULL,
      "ruleId" TEXT NOT NULL,
      "ruleVersion" INTEGER NOT NULL,
      "complianceRuleId" TEXT,
      "outcome" "RuleOutcome" NOT NULL,
      "evidence" TEXT,
      "message" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "RuleEvaluation_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "RuleEvaluation_evaluationId_fkey" FOREIGN KEY ("evaluationId")
        REFERENCES "ComplianceEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "RuleEvaluation_complianceRuleId_fkey" FOREIGN KEY ("complianceRuleId")
        REFERENCES "ComplianceRule"("id") ON UPDATE CASCADE
    )
  `);
  console.log("Created RuleEvaluation table");

  await client.query(`CREATE INDEX IF NOT EXISTS "RuleEvaluation_evaluationId_idx" ON "RuleEvaluation" ("evaluationId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "RuleEvaluation_ruleId_idx" ON "RuleEvaluation" ("ruleId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "RuleEvaluation_outcome_idx" ON "RuleEvaluation" ("outcome")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "RuleEvaluation_complianceRuleId_idx" ON "RuleEvaluation" ("complianceRuleId")`);

  console.log("\nASRB Slice 1 completion migration done!");
  await client.end();
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
