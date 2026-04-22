import { describe, it, expect, beforeEach } from "vitest";
import {
  CatalogService,
  CatalogServiceError,
  MemoryRuleStore,
  type CreateRuleInput,
} from "@ums/compliance";

const validPredicate = { eq: [{ ref: "student.status" }, "ACTIVE"] };

function makeInput(overrides?: Partial<CreateRuleInput>): CreateRuleInput {
  return {
    ruleId: "HEC_TEST_RULE",
    source: "HEC",
    sourceReference: "HEC Policy 2023, Section 1",
    appliesToCaseTypes: ["SYNOPSIS_APPROVAL"],
    severity: "BLOCKING",
    evaluation: validPredicate,
    messageTemplate: "Student must be active",
    editedBy: "admin@test.com",
    ...overrides,
  };
}

describe("CatalogService", () => {
  let store: MemoryRuleStore;
  let service: CatalogService;

  beforeEach(() => {
    store = new MemoryRuleStore();
    service = new CatalogService(store);
  });

  // ─── Create ─────────────────────────────────────────────────
  describe("createRule", () => {
    it("creates a DRAFT rule at version 1", async () => {
      const rule = await service.createRule(makeInput());
      expect(rule.ruleId).toBe("HEC_TEST_RULE");
      expect(rule.version).toBe(1);
      expect(rule.status).toBe("DRAFT");
      expect(rule.source).toBe("HEC");
    });

    it("stores evaluation as JSON string", async () => {
      const rule = await service.createRule(makeInput());
      const parsed = JSON.parse(rule.evaluation);
      expect(parsed).toEqual(validPredicate);
    });

    it("stores appliesToCaseTypes as JSON array", async () => {
      const rule = await service.createRule(makeInput({ appliesToCaseTypes: ["SYNOPSIS_APPROVAL", "GEC_CONSTITUTION"] }));
      expect(JSON.parse(rule.appliesToCaseTypes)).toEqual(["SYNOPSIS_APPROVAL", "GEC_CONSTITUTION"]);
    });

    it("rejects duplicate ruleId", async () => {
      await service.createRule(makeInput());
      await expect(service.createRule(makeInput())).rejects.toThrow(CatalogServiceError);
      await expect(service.createRule(makeInput())).rejects.toThrow("already exists");
    });

    it("rejects invalid predicate", async () => {
      await expect(
        service.createRule(makeInput({ evaluation: { bogus: true } as any }))
      ).rejects.toThrow("Invalid predicate");
    });
  });

  // ─── Update Draft ───────────────────────────────────────────
  describe("updateDraft", () => {
    it("updates DRAFT rule in place", async () => {
      const rule = await service.createRule(makeInput());
      const updated = await service.updateDraft(rule.id, {
        severity: "WARNING",
        editedBy: "editor@test.com",
      });
      expect(updated.severity).toBe("WARNING");
      expect(updated.lastEditedBy).toBe("editor@test.com");
    });

    it("rejects editing non-DRAFT rule", async () => {
      const rule = await service.createRule(makeInput());
      await service.publish(rule.id, "admin@test.com");

      await expect(
        service.updateDraft(rule.id, { severity: "WARNING", editedBy: "x" })
      ).rejects.toThrow("Cannot edit non-DRAFT");
    });

    it("validates new predicate if provided", async () => {
      const rule = await service.createRule(makeInput());
      await expect(
        service.updateDraft(rule.id, {
          evaluation: {} as any,
          editedBy: "x",
        })
      ).rejects.toThrow("Invalid predicate");
    });
  });

  // ─── Publish ────────────────────────────────────────────────
  describe("publish", () => {
    it("transitions DRAFT to EFFECTIVE", async () => {
      const rule = await service.createRule(makeInput());
      const published = await service.publish(rule.id, "admin@test.com");
      expect(published.status).toBe("EFFECTIVE");
    });

    it("rejects publishing non-DRAFT", async () => {
      const rule = await service.createRule(makeInput());
      await service.publish(rule.id, "admin@test.com");
      await expect(service.publish(rule.id, "admin@test.com")).rejects.toThrow("Only DRAFT rules");
    });

    it("retires previous EFFECTIVE version on publish", async () => {
      // Create and publish v1
      const v1 = await service.createRule(makeInput());
      await service.publish(v1.id, "admin@test.com");

      // Create v2 draft
      const v2 = await service.createNewVersion("HEC_TEST_RULE", "admin@test.com");
      expect(v2.version).toBe(2);
      expect(v2.status).toBe("DRAFT");

      // Publish v2 — v1 should be retired
      await service.publish(v2.id, "admin@test.com");
      const v1After = await service.getRule(v1.id);
      expect(v1After!.status).toBe("RETIRED");

      const v2After = await service.getRule(v2.id);
      expect(v2After!.status).toBe("EFFECTIVE");
    });
  });

  // ─── Retire ─────────────────────────────────────────────────
  describe("retire", () => {
    it("retires an EFFECTIVE rule", async () => {
      const rule = await service.createRule(makeInput());
      await service.publish(rule.id, "admin@test.com");
      const retired = await service.retire(rule.id, "admin@test.com");
      expect(retired.status).toBe("RETIRED");
    });

    it("retires a DRAFT rule", async () => {
      const rule = await service.createRule(makeInput());
      const retired = await service.retire(rule.id, "admin@test.com");
      expect(retired.status).toBe("RETIRED");
    });

    it("rejects retiring already-RETIRED rule", async () => {
      const rule = await service.createRule(makeInput());
      await service.retire(rule.id, "admin@test.com");
      await expect(service.retire(rule.id, "admin@test.com")).rejects.toThrow("already RETIRED");
    });
  });

  // ─── Versioning ─────────────────────────────────────────────
  describe("versioning", () => {
    it("createNewVersion creates a draft from EFFECTIVE", async () => {
      const v1 = await service.createRule(makeInput());
      await service.publish(v1.id, "admin@test.com");

      const v2 = await service.createNewVersion("HEC_TEST_RULE", "admin@test.com");
      expect(v2.version).toBe(2);
      expect(v2.status).toBe("DRAFT");
      expect(v2.evaluation).toBe(v1.evaluation); // Copied from v1
    });

    it("rejects if draft already exists", async () => {
      const v1 = await service.createRule(makeInput());
      await service.publish(v1.id, "admin@test.com");
      await service.createNewVersion("HEC_TEST_RULE", "admin@test.com");

      await expect(
        service.createNewVersion("HEC_TEST_RULE", "admin@test.com")
      ).rejects.toThrow("already has a draft");
    });

    it("rejects if no EFFECTIVE version exists", async () => {
      // Create a rule, then retire it (so there's no DRAFT and no EFFECTIVE)
      const r = await service.createRule(makeInput());
      await service.retire(r.id, "admin@test.com");
      await expect(
        service.createNewVersion("HEC_TEST_RULE", "admin@test.com")
      ).rejects.toThrow("no EFFECTIVE version");
    });

    it("getRuleVersions returns all versions sorted by version desc", async () => {
      const v1 = await service.createRule(makeInput());
      await service.publish(v1.id, "admin@test.com");
      await service.createNewVersion("HEC_TEST_RULE", "admin@test.com");

      const versions = await service.getRuleVersions("HEC_TEST_RULE");
      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe(2);
      expect(versions[1].version).toBe(1);
    });
  });

  // ─── Queries ────────────────────────────────────────────────
  describe("queries", () => {
    it("listRules returns all rules", async () => {
      await service.createRule(makeInput({ ruleId: "RULE_A" }));
      await service.createRule(makeInput({ ruleId: "RULE_B" }));
      const rules = await service.listRules();
      expect(rules).toHaveLength(2);
    });

    it("listRules filters by status", async () => {
      const r1 = await service.createRule(makeInput({ ruleId: "RULE_A" }));
      await service.createRule(makeInput({ ruleId: "RULE_B" }));
      await service.publish(r1.id, "admin@test.com");

      const effective = await service.listRules({ status: "EFFECTIVE" });
      expect(effective).toHaveLength(1);
      expect(effective[0].ruleId).toBe("RULE_A");
    });

    it("getEffectiveRules filters by case type", async () => {
      const r1 = await service.createRule(makeInput({
        ruleId: "RULE_A",
        appliesToCaseTypes: ["SYNOPSIS_APPROVAL"],
      }));
      const r2 = await service.createRule(makeInput({
        ruleId: "RULE_B",
        appliesToCaseTypes: ["GEC_CONSTITUTION"],
      }));
      await service.publish(r1.id, "admin@test.com");
      await service.publish(r2.id, "admin@test.com");

      const synopsisRules = await service.getEffectiveRules("SYNOPSIS_APPROVAL");
      expect(synopsisRules).toHaveLength(1);
      expect(synopsisRules[0].ruleId).toBe("RULE_A");
    });
  });

  // ─── Conflict Detection ─────────────────────────────────────
  describe("conflict detection", () => {
    it("detects overlapping same-severity rules", async () => {
      const r1 = await service.createRule(makeInput({
        ruleId: "RULE_A",
        appliesToCaseTypes: ["SYNOPSIS_APPROVAL", "GEC_CONSTITUTION"],
        severity: "BLOCKING",
      }));
      const r2 = await service.createRule(makeInput({
        ruleId: "RULE_B",
        appliesToCaseTypes: ["SYNOPSIS_APPROVAL"],
        severity: "BLOCKING",
      }));
      await service.publish(r1.id, "admin@test.com");
      await service.publish(r2.id, "admin@test.com");

      const conflicts = await service.detectConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].overlappingCaseTypes).toContain("SYNOPSIS_APPROVAL");
    });

    it("no conflict for different severities", async () => {
      const r1 = await service.createRule(makeInput({
        ruleId: "RULE_A",
        appliesToCaseTypes: ["SYNOPSIS_APPROVAL"],
        severity: "BLOCKING",
      }));
      const r2 = await service.createRule(makeInput({
        ruleId: "RULE_B",
        appliesToCaseTypes: ["SYNOPSIS_APPROVAL"],
        severity: "WARNING",
      }));
      await service.publish(r1.id, "admin@test.com");
      await service.publish(r2.id, "admin@test.com");

      const conflicts = await service.detectConflicts();
      expect(conflicts).toHaveLength(0);
    });

    it("no conflict for non-overlapping case types", async () => {
      const r1 = await service.createRule(makeInput({
        ruleId: "RULE_A",
        appliesToCaseTypes: ["SYNOPSIS_APPROVAL"],
        severity: "BLOCKING",
      }));
      const r2 = await service.createRule(makeInput({
        ruleId: "RULE_B",
        appliesToCaseTypes: ["GEC_CONSTITUTION"],
        severity: "BLOCKING",
      }));
      await service.publish(r1.id, "admin@test.com");
      await service.publish(r2.id, "admin@test.com");

      const conflicts = await service.detectConflicts();
      expect(conflicts).toHaveLength(0);
    });
  });

  // ─── Dry Run ────────────────────────────────────────────────
  describe("dry run", () => {
    it("validates a correct predicate", () => {
      const result = service.dryRunValidate(validPredicate);
      expect(result.valid).toBe(true);
    });

    it("reports errors for invalid predicate", () => {
      const result = service.dryRunValidate({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("reports unknown attribute paths", () => {
      const result = service.dryRunValidate({ eq: [{ ref: "bogus.path" }, 1] });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("Unknown attribute path"))).toBe(true);
    });
  });
});
