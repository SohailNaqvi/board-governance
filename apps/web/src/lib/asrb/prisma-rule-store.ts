/**
 * Prisma-backed implementation of IRuleStore.
 *
 * Bridges the @ums/compliance CatalogService to the Prisma ORM layer.
 */

import type {
  IRuleStore,
  ComplianceRuleRecord,
  RuleFilter,
  RuleStatus,
} from "@ums/compliance";
import type {
  ComplianceRule as PrismaComplianceRule,
  RuleSource,
  RuleSeverity,
  Prisma,
} from "@prisma/client";
import prisma from "../prisma";

function toDomain(row: PrismaComplianceRule): ComplianceRuleRecord {
  return {
    id: row.id,
    ruleId: row.ruleId,
    source: row.source,
    sourceReference: row.sourceReference,
    appliesToCaseTypes: row.appliesToCaseTypes,
    appliesToProgrammeTypes: row.appliesToProgrammeTypes,
    severity: row.severity,
    evaluation: row.evaluation,
    messageTemplate: row.messageTemplate,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    version: row.version,
    status: row.status as RuleStatus,
    lastEditedBy: row.lastEditedBy,
    lastEditedAt: row.lastEditedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class PrismaRuleStore implements IRuleStore {
  async findById(id: string): Promise<ComplianceRuleRecord | null> {
    const row = await prisma.complianceRule.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByRuleId(ruleId: string): Promise<ComplianceRuleRecord[]> {
    const rows = await prisma.complianceRule.findMany({
      where: { ruleId },
      orderBy: { version: "desc" },
    });
    return rows.map(toDomain);
  }

  async findEffectiveByRuleId(ruleId: string): Promise<ComplianceRuleRecord | null> {
    const row = await prisma.complianceRule.findFirst({
      where: { ruleId, status: "EFFECTIVE" },
    });
    return row ? toDomain(row) : null;
  }

  async findAll(filter?: RuleFilter): Promise<ComplianceRuleRecord[]> {
    const where: Prisma.ComplianceRuleWhereInput = {};
    if (filter?.ruleId) where.ruleId = filter.ruleId;
    if (filter?.source) where.source = filter.source as RuleSource;
    if (filter?.status) where.status = filter.status;
    if (filter?.caseType) {
      // appliesToCaseTypes is a JSON string; use string contains as a heuristic
      where.appliesToCaseTypes = { contains: filter.caseType };
    }

    const rows = await prisma.complianceRule.findMany({
      where,
      orderBy: [{ ruleId: "asc" }, { version: "desc" }],
    });
    return rows.map(toDomain);
  }

  async findEffective(caseType?: string): Promise<ComplianceRuleRecord[]> {
    const where: Prisma.ComplianceRuleWhereInput = { status: "EFFECTIVE" };
    if (caseType) {
      where.appliesToCaseTypes = { contains: caseType };
    }

    const rows = await prisma.complianceRule.findMany({
      where,
      orderBy: { ruleId: "asc" },
    });
    return rows.map(toDomain);
  }

  async create(
    data: Omit<ComplianceRuleRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ComplianceRuleRecord> {
    const row = await prisma.complianceRule.create({
      data: {
        ruleId: data.ruleId,
        source: data.source as RuleSource,
        sourceReference: data.sourceReference,
        appliesToCaseTypes: data.appliesToCaseTypes,
        appliesToProgrammeTypes: data.appliesToProgrammeTypes,
        severity: data.severity as RuleSeverity,
        evaluation: data.evaluation,
        messageTemplate: data.messageTemplate,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        version: data.version,
        status: data.status,
        lastEditedBy: data.lastEditedBy,
        lastEditedAt: data.lastEditedAt,
      },
    });
    return toDomain(row);
  }

  async update(id: string, data: Partial<ComplianceRuleRecord>): Promise<ComplianceRuleRecord> {
    const updateData: Prisma.ComplianceRuleUpdateInput = {};
    if (data.sourceReference !== undefined) updateData.sourceReference = data.sourceReference;
    if (data.appliesToCaseTypes !== undefined) updateData.appliesToCaseTypes = data.appliesToCaseTypes;
    if (data.appliesToProgrammeTypes !== undefined) updateData.appliesToProgrammeTypes = data.appliesToProgrammeTypes;
    if (data.severity !== undefined) updateData.severity = data.severity as RuleSeverity;
    if (data.evaluation !== undefined) updateData.evaluation = data.evaluation;
    if (data.messageTemplate !== undefined) updateData.messageTemplate = data.messageTemplate;
    if (data.effectiveFrom !== undefined) updateData.effectiveFrom = data.effectiveFrom;
    if (data.effectiveTo !== undefined) updateData.effectiveTo = data.effectiveTo;
    if (data.version !== undefined) updateData.version = data.version;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.lastEditedBy !== undefined) updateData.lastEditedBy = data.lastEditedBy;
    if (data.lastEditedAt !== undefined) updateData.lastEditedAt = data.lastEditedAt;

    const row = await prisma.complianceRule.update({
      where: { id },
      data: updateData,
    });
    return toDomain(row);
  }
}

let _store: PrismaRuleStore | null = null;

export function createPrismaRuleStore(): IRuleStore {
  if (!_store) {
    _store = new PrismaRuleStore();
  }
  return _store;
}
