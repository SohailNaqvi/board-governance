/**
 * Production seed for compliance rules.
 *
 * Reads JSON fixtures from packages/compliance/seed/rules/ and inserts
 * each rule via CatalogService. Rules are created as DRAFT, then
 * published to EFFECTIVE.
 *
 * Idempotent: if a rule with the same ruleId already exists, it is skipped.
 * Exits with non-zero status if any rule fails to load.
 *
 * Usage:
 *   npx tsx prisma/seed-compliance-rules.ts
 *
 * Requires: DATABASE_URL in environment, prisma generate already run.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CatalogService } from "../packages/compliance/src/catalog/catalog-service";
import type { IRuleStore, RuleFilter, ComplianceRuleRecord } from "../packages/compliance/src/catalog/types";

const SEED_AUTHOR = "seed-compliance@system";

// ─── Fixture type ────────────────────────────────────────────────

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

// ─── Minimal IRuleStore backed by Prisma ─────────────────────────

function createStore(prisma: PrismaClient): IRuleStore {
  return {
    async findById(id: string) {
      return prisma.complianceRule.findUnique({ where: { id } }) as Promise<ComplianceRuleRecord | null>;
    },
    async findByRuleId(ruleId: string) {
      return prisma.complianceRule.findMany({
        where: { ruleId },
        orderBy: { version: "desc" },
      }) as unknown as Promise<ComplianceRuleRecord[]>;
    },
    async findEffectiveByRuleId(ruleId: string) {
      return prisma.complianceRule.findFirst({
        where: { ruleId, status: "EFFECTIVE" },
      }) as Promise<ComplianceRuleRecord | null>;
    },
    async findAll(filter?: RuleFilter) {
      const where: Record<string, unknown> = {};
      if (filter?.ruleId) where.ruleId = filter.ruleId;
      if (filter?.source) where.source = filter.source;
      if (filter?.status) where.status = filter.status;
      return prisma.complianceRule.findMany({ where, orderBy: { createdAt: "desc" } }) as unknown as Promise<ComplianceRuleRecord[]>;
    },
    async findEffective(_caseType?: string) {
      return prisma.complianceRule.findMany({ where: { status: "EFFECTIVE" } }) as unknown as Promise<ComplianceRuleRecord[]>;
    },
    async create(data: Omit<ComplianceRuleRecord, "id" | "createdAt" | "updatedAt">) {
      return prisma.complianceRule.create({ data: data as never }) as unknown as Promise<ComplianceRuleRecord>;
    },
    async update(id: string, data: Partial<ComplianceRuleRecord>) {
      return prisma.complianceRule.update({ where: { id }, data: data as never }) as unknown as Promise<ComplianceRuleRecord>;
    },
  };
}

// ─── Load fixtures ───────────────────────────────────────────────

function loadFixtures(): SeedRule[] {
  const seedDir = resolve(__dirname, "../packages/compliance/seed/rules");
  const hec = JSON.parse(readFileSync(resolve(seedDir, "hec-rules.json"), "utf-8")) as SeedRule[];
  const uni = JSON.parse(readFileSync(resolve(seedDir, "university-rules.json"), "utf-8")) as SeedRule[];
  return [...hec, ...uni];
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const prisma = new PrismaClient();
  const store = createStore(prisma);
  const service = new CatalogService(store);
  const fixtures = loadFixtures();

  console.log(`\nSeeding ${fixtures.length} compliance rules...\n`);

  let loaded = 0;
  let skipped = 0;
  let failed = 0;
  const failures: Array<{ ruleId: string; error: string }> = [];

  for (const fixture of fixtures) {
    try {
      // Check idempotency: skip if ruleId already exists
      const existing = await store.findByRuleId(fixture.ruleId);
      if (existing.length > 0) {
        console.log(`  SKIP  ${fixture.ruleId} (already exists, v${existing[0].version} ${existing[0].status})`);
        skipped++;
        continue;
      }

      // Create via CatalogService (validates predicate, enforces constraints)
      const rule = await service.createRule({
        ...fixture,
        editedBy: SEED_AUTHOR,
      });

      // Publish to EFFECTIVE
      await service.publish(rule.id, SEED_AUTHOR);

      console.log(`  LOAD  ${fixture.ruleId} v${rule.version} → EFFECTIVE`);
      loaded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  FAIL  ${fixture.ruleId}: ${message}`);
      failures.push({ ruleId: fixture.ruleId, error: message });
      failed++;
    }
  }

  console.log(`\nCompliance rules seed summary: ${loaded} loaded, ${skipped} skipped, ${failed} failed (of ${fixtures.length} total)`);

  if (failures.length > 0) {
    console.error("\nFailed rules:");
    for (const f of failures) {
      console.error(`  - ${f.ruleId}: ${f.error}`);
    }
  }

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
