/**
 * Catalog Service — CRUD + versioning + lifecycle for compliance rules.
 *
 * Rule lifecycle: DRAFT → EFFECTIVE → RETIRED
 *
 * Versioning:
 * - Editing a DRAFT updates in place (same version).
 * - Publishing a DRAFT transitions it to EFFECTIVE (same version).
 * - Editing an EFFECTIVE rule creates a new DRAFT at version+1.
 *   The current EFFECTIVE version stays live until the new draft is published.
 * - Publishing a new version retires the old EFFECTIVE version automatically.
 * - Retiring a rule marks it RETIRED; it can never become EFFECTIVE again.
 *
 * Rule uniqueness: (ruleId, version) is unique.
 */

import type {
  ComplianceRuleRecord,
  CreateRuleInput,
  UpdateRuleInput,
  IRuleStore,
  RuleFilter,
  ConflictInfo,
} from "./types.js";
import { validatePredicate } from "../predicate/validator.js";

export class CatalogServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "CatalogServiceError";
  }
}

export class CatalogService {
  constructor(private readonly store: IRuleStore) {}

  // ─── Query ──────────────────────────────────────────────────

  async getRule(id: string): Promise<ComplianceRuleRecord | null> {
    return this.store.findById(id);
  }

  async getRuleVersions(ruleId: string): Promise<ComplianceRuleRecord[]> {
    return this.store.findByRuleId(ruleId);
  }

  async listRules(filter?: RuleFilter): Promise<ComplianceRuleRecord[]> {
    return this.store.findAll(filter);
  }

  async getEffectiveRules(caseType?: string): Promise<ComplianceRuleRecord[]> {
    return this.store.findEffective(caseType);
  }

  // ─── Create ─────────────────────────────────────────────────

  async createRule(input: CreateRuleInput): Promise<ComplianceRuleRecord> {
    // Validate predicate expression
    const validationResult = validatePredicate(input.evaluation);
    if (!validationResult.valid) {
      throw new CatalogServiceError(
        `Invalid predicate: ${validationResult.errors.map((e) => e.message).join("; ")}`,
        "INVALID_PREDICATE"
      );
    }

    // Check for existing rule with same ruleId
    const existing = await this.store.findByRuleId(input.ruleId);
    if (existing.length > 0) {
      throw new CatalogServiceError(
        `Rule "${input.ruleId}" already exists. Use createNewVersion to edit.`,
        "RULE_EXISTS"
      );
    }

    return this.store.create({
      ruleId: input.ruleId,
      source: input.source,
      sourceReference: input.sourceReference ?? null,
      appliesToCaseTypes: JSON.stringify(input.appliesToCaseTypes),
      appliesToProgrammeTypes: input.appliesToProgrammeTypes
        ? JSON.stringify(input.appliesToProgrammeTypes)
        : null,
      severity: input.severity,
      evaluation: JSON.stringify(input.evaluation),
      messageTemplate: input.messageTemplate,
      effectiveFrom: input.effectiveFrom ?? null,
      effectiveTo: input.effectiveTo ?? null,
      version: 1,
      status: "DRAFT",
      lastEditedBy: input.editedBy,
      lastEditedAt: new Date(),
    });
  }

  // ─── Update (DRAFT only) ────────────────────────────────────

  async updateDraft(id: string, input: UpdateRuleInput): Promise<ComplianceRuleRecord> {
    const rule = await this.store.findById(id);
    if (!rule) {
      throw new CatalogServiceError(`Rule not found: ${id}`, "NOT_FOUND");
    }
    if (rule.status !== "DRAFT") {
      throw new CatalogServiceError(
        `Cannot edit non-DRAFT rule (status: ${rule.status}). Create a new version instead.`,
        "NOT_DRAFT"
      );
    }

    // Validate predicate if changed
    if (input.evaluation) {
      const validationResult = validatePredicate(input.evaluation);
      if (!validationResult.valid) {
        throw new CatalogServiceError(
          `Invalid predicate: ${validationResult.errors.map((e) => e.message).join("; ")}`,
          "INVALID_PREDICATE"
        );
      }
    }

    const updates: Partial<ComplianceRuleRecord> = {
      lastEditedBy: input.editedBy,
      lastEditedAt: new Date(),
    };

    if (input.sourceReference !== undefined) updates.sourceReference = input.sourceReference;
    if (input.appliesToCaseTypes) updates.appliesToCaseTypes = JSON.stringify(input.appliesToCaseTypes);
    if (input.appliesToProgrammeTypes) updates.appliesToProgrammeTypes = JSON.stringify(input.appliesToProgrammeTypes);
    if (input.severity) updates.severity = input.severity;
    if (input.evaluation) updates.evaluation = JSON.stringify(input.evaluation);
    if (input.messageTemplate) updates.messageTemplate = input.messageTemplate;
    if (input.effectiveFrom !== undefined) updates.effectiveFrom = input.effectiveFrom;
    if (input.effectiveTo !== undefined) updates.effectiveTo = input.effectiveTo;

    return this.store.update(id, updates);
  }

  // ─── Create New Version (from EFFECTIVE) ────────────────────

  async createNewVersion(ruleId: string, editedBy: string): Promise<ComplianceRuleRecord> {
    const versions = await this.store.findByRuleId(ruleId);
    if (versions.length === 0) {
      throw new CatalogServiceError(`Rule "${ruleId}" not found`, "NOT_FOUND");
    }

    // Check if there's already a DRAFT version
    const existingDraft = versions.find((v) => v.status === "DRAFT");
    if (existingDraft) {
      throw new CatalogServiceError(
        `Rule "${ruleId}" already has a draft (version ${existingDraft.version}). Edit that instead.`,
        "DRAFT_EXISTS"
      );
    }

    // Find the latest EFFECTIVE version
    const effective = versions.find((v) => v.status === "EFFECTIVE");
    if (!effective) {
      throw new CatalogServiceError(
        `Rule "${ruleId}" has no EFFECTIVE version to base a new version on`,
        "NO_EFFECTIVE"
      );
    }

    const nextVersion = Math.max(...versions.map((v) => v.version)) + 1;

    return this.store.create({
      ruleId: effective.ruleId,
      source: effective.source,
      sourceReference: effective.sourceReference,
      appliesToCaseTypes: effective.appliesToCaseTypes,
      appliesToProgrammeTypes: effective.appliesToProgrammeTypes,
      severity: effective.severity,
      evaluation: effective.evaluation,
      messageTemplate: effective.messageTemplate,
      effectiveFrom: effective.effectiveFrom,
      effectiveTo: effective.effectiveTo,
      version: nextVersion,
      status: "DRAFT",
      lastEditedBy: editedBy,
      lastEditedAt: new Date(),
    });
  }

  // ─── Publish (DRAFT → EFFECTIVE) ────────────────────────────

  async publish(id: string, editedBy: string): Promise<ComplianceRuleRecord> {
    const rule = await this.store.findById(id);
    if (!rule) {
      throw new CatalogServiceError(`Rule not found: ${id}`, "NOT_FOUND");
    }
    if (rule.status !== "DRAFT") {
      throw new CatalogServiceError(
        `Only DRAFT rules can be published (status: ${rule.status})`,
        "NOT_DRAFT"
      );
    }

    // Validate predicate one more time
    const predicate = JSON.parse(rule.evaluation);
    const validationResult = validatePredicate(predicate);
    if (!validationResult.valid) {
      throw new CatalogServiceError(
        `Rule predicate is invalid: ${validationResult.errors.map((e) => e.message).join("; ")}`,
        "INVALID_PREDICATE"
      );
    }

    // Retire the currently EFFECTIVE version of this ruleId (if any)
    const currentEffective = await this.store.findEffectiveByRuleId(rule.ruleId);
    if (currentEffective && currentEffective.id !== id) {
      await this.store.update(currentEffective.id, {
        status: "RETIRED",
        lastEditedBy: editedBy,
        lastEditedAt: new Date(),
      });
    }

    return this.store.update(id, {
      status: "EFFECTIVE",
      lastEditedBy: editedBy,
      lastEditedAt: new Date(),
    });
  }

  // ─── Retire ─────────────────────────────────────────────────

  async retire(id: string, editedBy: string): Promise<ComplianceRuleRecord> {
    const rule = await this.store.findById(id);
    if (!rule) {
      throw new CatalogServiceError(`Rule not found: ${id}`, "NOT_FOUND");
    }
    if (rule.status === "RETIRED") {
      throw new CatalogServiceError("Rule is already RETIRED", "ALREADY_RETIRED");
    }

    return this.store.update(id, {
      status: "RETIRED",
      lastEditedBy: editedBy,
      lastEditedAt: new Date(),
    });
  }

  // ─── Conflict Detection ─────────────────────────────────────

  async detectConflicts(ruleId?: string): Promise<ConflictInfo[]> {
    const effectiveRules = await this.store.findEffective();
    const conflicts: ConflictInfo[] = [];

    // If checking a specific rule, also include its draft
    let targetRules = effectiveRules;
    if (ruleId) {
      const versions = await this.store.findByRuleId(ruleId);
      const draft = versions.find((v) => v.status === "DRAFT");
      if (draft) {
        targetRules = [...effectiveRules, draft];
      }
    }

    // Pairwise conflict check: same case types + same severity + contradictory logic
    for (let i = 0; i < targetRules.length; i++) {
      for (let j = i + 1; j < targetRules.length; j++) {
        const a = targetRules[i];
        const b = targetRules[j];

        // Skip if same ruleId (different versions of same rule)
        if (a.ruleId === b.ruleId) continue;

        // Check for overlapping case types
        const aCaseTypes: string[] = JSON.parse(a.appliesToCaseTypes);
        const bCaseTypes: string[] = JSON.parse(b.appliesToCaseTypes);
        const overlap = aCaseTypes.filter((ct) => bCaseTypes.includes(ct));

        if (overlap.length === 0) continue;

        // Check for overlapping effective dates
        if (a.effectiveTo && b.effectiveFrom && a.effectiveTo < b.effectiveFrom) continue;
        if (b.effectiveTo && a.effectiveFrom && b.effectiveTo < a.effectiveFrom) continue;

        // Same severity, overlapping case types, overlapping dates = potential conflict
        if (a.severity === b.severity) {
          conflicts.push({
            ruleA: { ruleId: a.ruleId, version: a.version },
            ruleB: { ruleId: b.ruleId, version: b.version },
            reason: `Same severity (${a.severity}) with overlapping case types`,
            overlappingCaseTypes: overlap,
          });
        }
      }
    }

    return conflicts;
  }

  // ─── Dry Run ────────────────────────────────────────────────

  /**
   * Validate a predicate expression without persisting it.
   * Returns validation result for the UI predicate builder.
   */
  dryRunValidate(evaluation: Record<string, unknown>) {
    return validatePredicate(evaluation);
  }
}
