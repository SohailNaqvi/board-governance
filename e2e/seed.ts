/**
 * Playwright E2E seed — inserts compliance rules via CatalogService.
 *
 * Constraint: uses the public CatalogService API (not raw Prisma) so that
 * validation, versioning, and conflict detection are preserved.
 *
 * Isolation: operates on whichever DATABASE_URL is set in the environment.
 * CI points this at a throwaway Postgres service container.
 * The teardown function removes only the rules this script inserted.
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
let seededIds: string[] = [];

export async function seedRules(): Promise<string[]> {
  prisma = new PrismaClient();
  const store = createStore(prisma);
  const service = new CatalogService(store);
  const fixtures = loadFixtures();

  seededIds = [];
  for (const fixture of fixtures) {
    try {
      const rule = await service.createRule({
        ...fixture,
        editedBy: SEED_AUTHOR,
      });
      // Publish immediately so rules show as EFFECTIVE in the UI
      const published = await service.publish(rule.id, SEED_AUTHOR);
      seededIds.push(published.id);
    } catch (err) {
      console.warn(`[e2e] Skipping rule ${fixture.ruleId}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return seededIds;
}

export async function teardownRules(): Promise<void> {
  if (!prisma) return;

  // Delete only rules created by this seed run
  await prisma.complianceRule.deleteMany({
    where: { lastEditedBy: SEED_AUTHOR },
  });

  await prisma.$disconnect();
  prisma = null;
  seededIds = [];
}
