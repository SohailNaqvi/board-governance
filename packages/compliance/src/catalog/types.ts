/**
 * Catalog Types — Domain types for compliance rule management.
 *
 * These mirror the Prisma ComplianceRule model but are defined here
 * to keep @ums/compliance decoupled from the ORM layer.
 */

export type RuleStatus = "DRAFT" | "EFFECTIVE" | "RETIRED";

export interface ComplianceRuleRecord {
  id: string;
  ruleId: string;
  source: string; // RuleSource enum value
  sourceReference: string | null;
  appliesToCaseTypes: string; // JSON array
  appliesToProgrammeTypes: string | null; // JSON array
  severity: string; // RuleSeverity enum value
  evaluation: string; // JSON predicate expression
  messageTemplate: string;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  version: number;
  status: RuleStatus;
  lastEditedBy: string | null;
  lastEditedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRuleInput {
  ruleId: string;
  source: string;
  sourceReference?: string;
  appliesToCaseTypes: string[];
  appliesToProgrammeTypes?: string[];
  severity: string;
  evaluation: Record<string, unknown>; // PredicateNode as plain object
  messageTemplate: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  editedBy: string;
}

export interface UpdateRuleInput {
  sourceReference?: string;
  appliesToCaseTypes?: string[];
  appliesToProgrammeTypes?: string[];
  severity?: string;
  evaluation?: Record<string, unknown>;
  messageTemplate?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  editedBy: string;
}

/**
 * Persistence interface — implemented by the web app's Prisma adapter.
 * The catalog service programs against this interface, not Prisma directly.
 */
export interface IRuleStore {
  findById(id: string): Promise<ComplianceRuleRecord | null>;
  findByRuleId(ruleId: string): Promise<ComplianceRuleRecord[]>;
  findEffectiveByRuleId(ruleId: string): Promise<ComplianceRuleRecord | null>;
  findAll(filter?: RuleFilter): Promise<ComplianceRuleRecord[]>;
  findEffective(caseType?: string): Promise<ComplianceRuleRecord[]>;
  create(data: Omit<ComplianceRuleRecord, "id" | "createdAt" | "updatedAt">): Promise<ComplianceRuleRecord>;
  update(id: string, data: Partial<ComplianceRuleRecord>): Promise<ComplianceRuleRecord>;
}

export interface RuleFilter {
  ruleId?: string;
  source?: string;
  status?: RuleStatus;
  caseType?: string;
}

export interface ConflictInfo {
  ruleA: { ruleId: string; version: number };
  ruleB: { ruleId: string; version: number };
  reason: string;
  overlappingCaseTypes: string[];
}
