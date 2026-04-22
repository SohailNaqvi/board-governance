import { describe, it, expect } from "vitest";
import {
  PredicateNodeSchema,
  OperandSchema,
  getNodeType,
  isRef,
  isSafeFunction,
  isLogicalOp,
  isComparisonOp,
  isSetOp,
  isExistenceOp,
  isStringOp,
} from "@ums/compliance";

describe("Predicate Grammar — Zod Schemas", () => {
  // ─── Logical Nodes ──────────────────────────────────────────
  describe("logical nodes", () => {
    it("parses all node with children", () => {
      const node = { all: [{ eq: [{ ref: "student.status" }, "ACTIVE"] }] };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
    });

    it("parses any node", () => {
      const node = { any: [{ eq: [1, 1] }, { eq: [2, 2] }] };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
    });

    it("parses not node", () => {
      const node = { not: { eq: [{ ref: "student.status" }, "ACTIVE"] } };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
    });

    it("rejects empty all array", () => {
      const node = { all: [] };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(false);
    });

    it("rejects all array exceeding 20 children", () => {
      const children = Array.from({ length: 21 }, () => ({ eq: [1, 1] }));
      const result = PredicateNodeSchema.safeParse({ all: children });
      expect(result.success).toBe(false);
    });
  });

  // ─── Comparison Nodes ───────────────────────────────────────
  describe("comparison nodes", () => {
    for (const op of ["eq", "ne", "gt", "lt", "gte", "lte"] as const) {
      it(`parses ${op} node with ref and literal`, () => {
        const node = { [op]: [{ ref: "student.enrollmentDate" }, "2023-01-01"] };
        const result = PredicateNodeSchema.safeParse(node);
        expect(result.success).toBe(true);
      });
    }

    it("parses comparison with number operands", () => {
      const node = { gte: [{ ref: "supervisor.activeSupervisionCount" }, 5] };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
    });

    it("parses comparison with boolean operand", () => {
      const node = { eq: [{ ref: "student.courseworkCompleted" }, true] };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
    });
  });

  // ─── Set Nodes ──────────────────────────────────────────────
  describe("set nodes", () => {
    it("parses in node with ref and literal array", () => {
      const node = { in: [{ ref: "case.caseType" }, ["SYNOPSIS_APPROVAL", "GEC_CONSTITUTION"]] };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
    });

    it("parses not_in node", () => {
      const node = { not_in: [{ ref: "student.programmeType" }, ["MSc"]] };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
    });
  });

  // ─── Existence Nodes ────────────────────────────────────────
  describe("existence nodes", () => {
    it("parses exists node", () => {
      const result = PredicateNodeSchema.safeParse({ exists: "student.supervisorEmpId" });
      expect(result.success).toBe(true);
    });

    it("parses not_exists node", () => {
      const result = PredicateNodeSchema.safeParse({ not_exists: "student.comprehensiveExamDate" });
      expect(result.success).toBe(true);
    });

    it("rejects exists with empty string", () => {
      const result = PredicateNodeSchema.safeParse({ exists: "" });
      expect(result.success).toBe(false);
    });
  });

  // ─── String Nodes ──────────────────────────────────────────
  describe("string nodes", () => {
    it("parses matches_regex node", () => {
      const node = { matches_regex: [{ ref: "student.registrationNumber" }, "^REG-\\d{4}-\\d{3}$"] };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
    });

    it("parses contains node", () => {
      const node = { contains: [{ ref: "supervisor.specialization" }, "AI"] };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
    });
  });

  // ─── Safe Functions as Operands ─────────────────────────────
  describe("safe function operands", () => {
    it("parses len function", () => {
      const result = OperandSchema.safeParse({ len: { ref: "supervisor.publications" } });
      expect(result.success).toBe(true);
    });

    it("parses today function", () => {
      const result = OperandSchema.safeParse({ today: {} });
      expect(result.success).toBe(true);
    });

    it("parses years_between function", () => {
      const operand = { years_between: [{ ref: "student.enrollmentDate" }, { today: {} }] };
      const result = OperandSchema.safeParse(operand);
      expect(result.success).toBe(true);
    });

    it("parses months_between function", () => {
      const operand = { months_between: [{ ref: "student.enrollmentDate" }, { today: {} }] };
      const result = OperandSchema.safeParse(operand);
      expect(result.success).toBe(true);
    });

    it("parses lower function", () => {
      const result = OperandSchema.safeParse({ lower: { ref: "student.name" } });
      expect(result.success).toBe(true);
    });

    it("parses upper function", () => {
      const result = OperandSchema.safeParse({ upper: { ref: "student.name" } });
      expect(result.success).toBe(true);
    });

    it("parses institution_recognized function", () => {
      const operand = {
        institution_recognized: {
          name: { ref: "supervisor.highestQualification.degree" },
          country: "Pakistan",
        },
      };
      const result = OperandSchema.safeParse(operand);
      expect(result.success).toBe(true);
    });

    it("parses count_where function", () => {
      const operand = {
        count_where: {
          in: { ref: "supervisor.publications" },
          where: { in: [{ ref: "item.indexedIn" }, ["HEC-W"]] },
        },
      };
      const result = OperandSchema.safeParse(operand);
      expect(result.success).toBe(true);
    });

    it("rejects today with extra keys", () => {
      const result = OperandSchema.safeParse({ today: { extra: true } });
      expect(result.success).toBe(false);
    });
  });

  // ─── Nested / Complex Expressions ──────────────────────────
  describe("complex nested expressions", () => {
    it("parses deeply nested all/any/not", () => {
      const node = {
        all: [
          { any: [{ eq: [1, 1] }, { not: { eq: [2, 3] } }] },
          { gte: [{ len: { ref: "supervisor.publications" } }, 2] },
        ],
      };
      const result = PredicateNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
    });
  });

  // ─── Rejection Cases ───────────────────────────────────────
  describe("rejection cases", () => {
    it("rejects empty object", () => {
      const result = PredicateNodeSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects object with unknown key", () => {
      const result = PredicateNodeSchema.safeParse({ unknown_op: [1, 2] });
      expect(result.success).toBe(false);
    });

    it("rejects null", () => {
      const result = PredicateNodeSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("rejects string", () => {
      const result = PredicateNodeSchema.safeParse("not a node");
      expect(result.success).toBe(false);
    });
  });
});

describe("Predicate Grammar — Type Guards", () => {
  describe("getNodeType", () => {
    it("returns correct type for known node", () => {
      expect(getNodeType({ eq: [1, 2] })).toBe("eq");
      expect(getNodeType({ all: [] })).toBe("all");
      expect(getNodeType({ not: {} })).toBe("not");
      expect(getNodeType({ exists: "a" })).toBe("exists");
    });

    it("returns null for multi-key objects", () => {
      expect(getNodeType({ eq: [1, 2], ne: [3, 4] })).toBe(null);
    });

    it("returns null for unknown keys", () => {
      expect(getNodeType({ foo: "bar" })).toBe(null);
    });

    it("returns null for non-objects", () => {
      expect(getNodeType(null)).toBe(null);
      expect(getNodeType("string")).toBe(null);
      expect(getNodeType(42)).toBe(null);
      expect(getNodeType([])).toBe(null);
    });
  });

  describe("isRef", () => {
    it("detects ref objects", () => {
      expect(isRef({ ref: "student.name" })).toBe(true);
    });

    it("rejects non-ref objects", () => {
      expect(isRef({ len: { ref: "x" } })).toBe(false);
      expect(isRef("string")).toBe(false);
      expect(isRef(null)).toBe(false);
      expect(isRef(42)).toBe(false);
    });
  });

  describe("isSafeFunction", () => {
    it("detects safe function objects", () => {
      expect(isSafeFunction({ len: { ref: "x" } })).toBe(true);
      expect(isSafeFunction({ today: {} })).toBe(true);
      expect(isSafeFunction({ lower: "abc" })).toBe(true);
    });

    it("rejects non-function objects", () => {
      expect(isSafeFunction({ ref: "x" })).toBe(false);
      expect(isSafeFunction({ unknown: 1 })).toBe(false);
      expect(isSafeFunction(null)).toBe(false);
    });
  });

  describe("category helpers", () => {
    it("isLogicalOp", () => {
      expect(isLogicalOp("all")).toBe(true);
      expect(isLogicalOp("any")).toBe(true);
      expect(isLogicalOp("not")).toBe(true);
      expect(isLogicalOp("eq")).toBe(false);
    });

    it("isComparisonOp", () => {
      expect(isComparisonOp("eq")).toBe(true);
      expect(isComparisonOp("lte")).toBe(true);
      expect(isComparisonOp("all")).toBe(false);
    });

    it("isSetOp", () => {
      expect(isSetOp("in")).toBe(true);
      expect(isSetOp("not_in")).toBe(true);
      expect(isSetOp("eq")).toBe(false);
    });

    it("isExistenceOp", () => {
      expect(isExistenceOp("exists")).toBe(true);
      expect(isExistenceOp("not_exists")).toBe(true);
      expect(isExistenceOp("in")).toBe(false);
    });

    it("isStringOp", () => {
      expect(isStringOp("matches_regex")).toBe(true);
      expect(isStringOp("contains")).toBe(true);
      expect(isStringOp("eq")).toBe(false);
    });
  });
});
