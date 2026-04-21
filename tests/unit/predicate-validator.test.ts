import { describe, it, expect, beforeEach } from "vitest";
import {
  validatePredicate,
  resetAttributeCatalog,
} from "@ums/compliance";

describe("Predicate Validator", () => {
  beforeEach(() => {
    resetAttributeCatalog();
  });

  // ─── Structural Validation (Zod) ─────────────────────────────
  describe("structural validation", () => {
    it("rejects non-object input", () => {
      const result = validatePredicate("not an object");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("rejects null input", () => {
      const result = validatePredicate(null);
      expect(result.valid).toBe(false);
    });

    it("rejects empty object", () => {
      const result = validatePredicate({});
      expect(result.valid).toBe(false);
    });
  });

  // ─── Valid Predicates ─────────────────────────────────────────
  describe("valid predicates", () => {
    it("accepts simple eq with known attribute", () => {
      const result = validatePredicate({
        eq: [{ ref: "student.status" }, "ACTIVE"],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("accepts comparison with number", () => {
      const result = validatePredicate({
        gte: [{ ref: "supervisor.activeSupervisionCount" }, 0],
      });
      expect(result.valid).toBe(true);
    });

    it("accepts nested all/any", () => {
      const result = validatePredicate({
        all: [
          { eq: [{ ref: "case.caseType" }, "SYNOPSIS_APPROVAL"] },
          { any: [
            { eq: [{ ref: "student.programmeType" }, "PhD"] },
            { eq: [{ ref: "student.programmeType" }, "MPhil"] },
          ]},
        ],
      });
      expect(result.valid).toBe(true);
    });

    it("accepts not node", () => {
      const result = validatePredicate({
        not: { eq: [{ ref: "student.courseworkCompleted" }, false] },
      });
      expect(result.valid).toBe(true);
    });

    it("accepts exists node with known path", () => {
      const result = validatePredicate({
        exists: "student.supervisorEmpId",
      });
      expect(result.valid).toBe(true);
    });

    it("accepts in node with literal array", () => {
      const result = validatePredicate({
        in: [{ ref: "case.caseType" }, ["SYNOPSIS_APPROVAL", "GEC_CONSTITUTION"]],
      });
      expect(result.valid).toBe(true);
    });

    it("accepts matches_regex with valid pattern", () => {
      const result = validatePredicate({
        matches_regex: [{ ref: "student.registrationNumber" }, "^REG-\\d+"],
      });
      expect(result.valid).toBe(true);
    });

    it("accepts contains node", () => {
      const result = validatePredicate({
        contains: [{ ref: "supervisor.specialization" }, "AI"],
      });
      expect(result.valid).toBe(true);
    });

    it("accepts safe function operands", () => {
      const result = validatePredicate({
        gte: [{ len: { ref: "supervisor.publications" } }, 2],
      });
      expect(result.valid).toBe(true);
    });

    it("accepts years_between function", () => {
      const result = validatePredicate({
        gte: [
          { years_between: [{ ref: "student.enrollmentDate" }, { today: {} }] },
          3,
        ],
      });
      expect(result.valid).toBe(true);
    });

    it("accepts programme.ruleParameters dynamic paths", () => {
      const result = validatePredicate({
        gte: [{ ref: "programme.ruleParameters.minHECPublications" }, 2],
      });
      expect(result.valid).toBe(true);
    });

    it("accepts item.* paths inside count_where", () => {
      const result = validatePredicate({
        gte: [
          {
            count_where: {
              in: { ref: "supervisor.publications" },
              where: { in: [{ ref: "item.indexedIn" }, ["HEC-W"]] },
            },
          },
          2,
        ],
      });
      expect(result.valid).toBe(true);
    });
  });

  // ─── Unknown Attribute Paths ──────────────────────────────────
  describe("unknown attribute paths", () => {
    it("rejects unknown ref path", () => {
      const result = validatePredicate({
        eq: [{ ref: "student.nonExistentField" }, "value"],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("Unknown attribute path");
    });

    it("rejects unknown exists path", () => {
      const result = validatePredicate({
        exists: "bogus.path",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("Unknown attribute path");
    });

    it("rejects unknown ref in nested expression", () => {
      const result = validatePredicate({
        all: [
          { eq: [{ ref: "student.status" }, "ACTIVE"] },
          { gt: [{ ref: "completely.made.up" }, 0] },
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("completely.made.up"))).toBe(true);
    });
  });

  // ─── Depth Limit ──────────────────────────────────────────────
  describe("nesting depth limit", () => {
    it("rejects expression exceeding default depth of 6", () => {
      // Build a 7-deep nesting: not(not(not(not(not(not(not(eq)))))))
      let node: unknown = { eq: [1, 1] };
      for (let i = 0; i < 7; i++) {
        node = { not: node };
      }
      const result = validatePredicate(node);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("Nesting depth"))).toBe(true);
    });

    it("accepts expression at exactly max depth", () => {
      // 6 levels: not(not(not(not(not(not(eq))))))
      let node: unknown = { eq: [1, 1] };
      for (let i = 0; i < 6; i++) {
        node = { not: node };
      }
      const result = validatePredicate(node);
      expect(result.valid).toBe(true);
    });

    it("respects custom maxDepth option", () => {
      let node: unknown = { eq: [1, 1] };
      for (let i = 0; i < 3; i++) {
        node = { not: node };
      }
      const result = validatePredicate(node, { maxDepth: 2 });
      expect(result.valid).toBe(false);
    });
  });

  // ─── Regex Validation ─────────────────────────────────────────
  describe("regex validation", () => {
    it("rejects invalid regex pattern", () => {
      const result = validatePredicate({
        matches_regex: [{ ref: "student.registrationNumber" }, "[invalid("],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("Invalid regex"))).toBe(true);
    });

    it("accepts valid regex pattern", () => {
      const result = validatePredicate({
        matches_regex: [{ ref: "student.name" }, "^[A-Z].*$"],
      });
      expect(result.valid).toBe(true);
    });
  });

  // ─── Safe Function Validation ─────────────────────────────────
  describe("safe function validation", () => {
    it("rejects unknown safe function", () => {
      const result = validatePredicate({
        eq: [{ unknown_func: { ref: "x" } } as any, 1],
      });
      // This should either fail structural parse or report unknown function
      expect(result.valid).toBe(false);
    });

    it("validates institution_recognized operands", () => {
      const result = validatePredicate({
        eq: [
          {
            institution_recognized: {
              name: { ref: "supervisor.name" },
              country: { ref: "student.department" },
            },
          },
          true,
        ],
      });
      expect(result.valid).toBe(true);
    });

    it("validates lower/upper operands", () => {
      const result = validatePredicate({
        eq: [{ lower: { ref: "student.name" } }, "test"],
      });
      expect(result.valid).toBe(true);
    });
  });

  // ─── Error Path Reporting ─────────────────────────────────────
  describe("error path reporting", () => {
    it("reports correct path for nested errors", () => {
      const result = validatePredicate({
        all: [
          { eq: [{ ref: "student.status" }, "ACTIVE"] },
          { eq: [{ ref: "bogus.field" }, "value"] },
        ],
      });
      expect(result.valid).toBe(false);
      const err = result.errors[0];
      expect(err.path).toContain("all[1]");
    });
  });
});
