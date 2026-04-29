/**
 * Playwright E2E seed — inserts compliance rules via CatalogService
 * and ASRB cases for testing list/detail pages.
 *
 * Isolation: operates on whichever DATABASE_URL is set in the environment.
 * CI points this at a throwaway Postgres service container.
 * The teardown functions remove only what this script inserted.
 */

import { CatalogService } from "../packages/compliance/src/catalog/catalog-service";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── Prisma-backed rule store (inline to avoid importing from apps/web) ──

function createStore(prisma: PrismaClient) {
  return {
    async findById(id: string) {
      return prisma.complianceRule.findUnique({ where: { id } });
    },
    async findByRuleId(ruleId: string) {
      return prisma.complianceRule.findMany({
        where: { ruleId },
        orderBy: { version: "desc" },
      });
    },
    async findEffectiveByRuleId(ruleId: string) {
      return prisma.complianceRule.findFirst({
        where: { ruleId, status: "EFFECTIVE" },
      });
    },
    async findAll(filter?: { ruleId?: string; source?: string; status?: string; caseType?: string }) {
      const where: Record<string, unknown> = {};
      if (filter?.ruleId) where.ruleId = filter.ruleId;
      if (filter?.source) where.source = filter.source;
      if (filter?.status) where.status = filter.status;
      return prisma.complianceRule.findMany({ where, orderBy: { createdAt: "desc" } });
    },
    async findEffective(_caseType?: string) {
      const where: Record<string, unknown> = { status: "EFFECTIVE" };
      return prisma.complianceRule.findMany({ where });
    },
    async create(data: Record<string, unknown>) {
      return prisma.complianceRule.create({ data: data as never });
    },
    async update(id: string, data: Record<string, unknown>) {
      return prisma.complianceRule.update({ where: { id }, data: data as never });
    },
  };
}

// ─── Seed data loader ────────────────────────────────────────────

interface SeedRule {
  ruleId: string;
  source: string;
  sourceReference?: string;
  appliesToCaseTypes: string[];
  appliesToProgrammeTypes?: string[];
  severity: string;
  evaluation: Record<string, unknown>;
  messageTemplate: string;
}

function loadFixtures(): SeedRule[] {
  const seedDir = resolve(__dirname, "../packages/compliance/seed/rules");
  const hecRules = JSON.parse(
    readFileSync(resolve(seedDir, "hec-rules.json"), "utf-8")
  ) as SeedRule[];
  const uniRules = JSON.parse(
    readFileSync(resolve(seedDir, "university-rules.json"), "utf-8")
  ) as SeedRule[];
  return [...hecRules, ...uniRules];
}

// ─── Public API ──────────────────────────────────────────────────

const SEED_AUTHOR = "e2e-seed@playwright.test";

let prisma: PrismaClient | null = null;
let seededRuleIds: string[] = [];
let seededCaseIds: string[] = [];

export async function seedRules(): Promise<string[]> {
  prisma = new PrismaClient();
  const store = createStore(prisma);
  const service = new CatalogService(store);
  const fixtures = loadFixtures();

  seededRuleIds = [];
  for (const fixture of fixtures) {
    try {
      const rule = await service.createRule({
        ...fixture,
        editedBy: SEED_AUTHOR,
      });
      // Publish immediately so rules show as EFFECTIVE in the UI
      const published = await service.publish(rule.id, SEED_AUTHOR);
      seededRuleIds.push(published.id);
    } catch (err) {
      console.warn(`[e2e] Skipping rule ${fixture.ruleId}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return seededRuleIds;
}

/**
 * Seed ASRB cases for testing list/detail pages.
 * Creates a feeder client first, then 20 test cases with various statuses.
 */
export async function seedAsrbCases(): Promise<string[]> {
  if (!prisma) prisma = new PrismaClient();

  try {
    // Create or get a feeder client
    const feederClient = await prisma.feederClient.upsert({
      where: { feederBodyCode: "E2E_TEST_DGSC" },
      update: {},
      create: {
        displayName: "E2E Test DGSC",
        feederBodyType: "DGSC",
        feederBodyCode: "E2E_TEST_DGSC",
        apiKeyHash: "fake-hash-for-e2e",
        permittedCaseTypes: JSON.stringify([
          "SYNOPSIS_APPROVAL",
          "EXAMINER_APPOINTMENT",
          "RESULT_APPROVAL",
          "SUPERVISOR_CHANGE",
        ]),
      },
    });

    // Create test cases with different statuses and types
    const statuses = [
      "RECEIVED",
      "COMPLIANCE_EVALUATED",
      "VETTING",
      "READY_FOR_AGENDA",
      "ON_AGENDA",
      "DECIDED",
      "CLOSED",
      "RETURNED",
      "HELD",
      "WITHDRAWN",
      "URGENT_CIRCULATION",
      "DEFERRED",
    ];

    const caseTypes = ["SYNOPSIS_APPROVAL", "EXAMINER_APPOINTMENT", "RESULT_APPROVAL", "SUPERVISOR_CHANGE"];

    const cases = [];

    for (let i = 0; i < 20; i++) {
      const status = statuses[i % statuses.length];
      const caseType = caseTypes[i % caseTypes.length];
      const urgency = i % 5 === 0 ? "URGENT_CIRCULATION" : "NORMAL";

      const caseRecord = await prisma.aSRBCase.create({
        data: {
          receiptReference: `E2E-TEST-${String(i + 1).padStart(5, "0")}`,
          idempotencyKey: `e2e-idempotency-${i}`,
          feederClientId: feederClient.id,
          feederBodyType: "DGSC",
          feederBodyCode: "E2E_TEST_DGSC",
          caseType: caseType as any,
          status: status as any,
          urgency: urgency as any,
          studentRegNo: `STU${String(100000 + i).slice(-5)}`,
          supervisorEmpId: `SUP${String(200000 + i).slice(-5)}`,
          programmeCode: `PROG-${["PhD", "MSc", "MEng"][i % 3]}`,
          casePayload: JSON.stringify({
            thesis_title: `Test Thesis ${i + 1}: Research on Computational Systems`,
            keywords: ["testing", "e2e", "asrb"],
            similarity_index: Math.random() * 30,
            submission_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          }),
        },
      });

      cases.push(caseRecord.id);
    }

    seededCaseIds = cases;
    return cases;
  } finally {
    // Note: Don't disconnect here; it's done in teardownAll
  }
}

export async function teardownRules(): Promise<void> {
  if (!prisma) return;

  // Delete only rules created by this seed run
  await prisma.complianceRule.deleteMany({
    where: { lastEditedBy: SEED_AUTHOR },
  });

  seededRuleIds = [];
}

/**
 * Tear down ASRB cases and feeder client.
 */
export async function teardownAsrbCases(): Promise<void> {
  if (!prisma) return;

  // Delete cases
  if (seededCaseIds.length > 0) {
    await prisma.aSRBCase.deleteMany({
      where: { id: { in: seededCaseIds } },
    });
  }

  // Delete feeder client
  await prisma.feederClient.deleteMany({
    where: { feederBodyCode: "E2E_TEST_DGSC" },
  });

  seededCaseIds = [];
}

/**
 * Clean up all prisma connections (call at very end).
 */
export async function teardownAll(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Seed board action items for testing list/detail pages.
 */
let seededActionIds: string[] = [];

export async function seedBoardActions(): Promise<string[]> {
  if (!prisma) prisma = new PrismaClient();

  try {
    const actions = [
      {
        actionRef: "E2E-TEST-BAI-001",
        description: "Test action item 1 for E2E",
        sourceMeeting: "E2E Test Meeting Q1",
        category: "GOVERNANCE" as const,
        ownerName: "Test Owner 1",
        ownerUnit: "TEST",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "OPEN" as const,
        progressPercent: 0,
      },
      {
        actionRef: "E2E-TEST-BAI-002",
        description: "Test action item 2 for E2E",
        sourceMeeting: "E2E Test Meeting Q1",
        category: "STRATEGIC" as const,
        ownerName: "Test Owner 2",
        ownerUnit: "TEST",
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        status: "OVERDUE" as const,
        progressPercent: 25,
      },
      {
        actionRef: "E2E-TEST-BAI-003",
        description: "Test action item 3 for E2E",
        sourceMeeting: "E2E Test Meeting Q2",
        category: "ACADEMIC" as const,
        ownerName: "Test Owner 3",
        ownerUnit: "TEST",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        status: "IN_PROGRESS" as const,
        progressPercent: 50,
      },
    ];

    seededActionIds = [];
    for (const action of actions) {
      const created = await prisma.boardActionItem.upsert({
        where: { actionRef: action.actionRef },
        update: action,
        create: action,
      });
      seededActionIds.push(created.id);
    }

    return seededActionIds;
  } finally {
    // Note: Don't disconnect here; it's done in teardownAll
  }
}

export async function teardownBoardActions(): Promise<void> {
  if (!prisma) return;

  // Delete only actions created by this seed run
  if (seededActionIds.length > 0) {
    await prisma.boardActionItem.deleteMany({
      where: {
        actionRef: { startsWith: "E2E-TEST-BAI-" },
      },
    });
  }

  seededActionIds = [];
}
