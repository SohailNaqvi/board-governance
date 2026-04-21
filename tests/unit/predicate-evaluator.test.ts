import { describe, it, expect } from "vitest";
import {
  evaluatePredicate,
  EvaluationError,
  buildComputedFields,
  resolveRef,
  type CaseContext,
  type CaseSnapshot,
} from "@ums/compliance";
import type { StudentRecord, SupervisorRecord, ProgrammeRecord } from "@ums/source-data";

// ─── Test Fixtures ──────────────────────────────────────────────

const testCase: CaseSnapshot = {
  caseType: "SYNOPSIS_APPROVAL",
  status: "RECEIVED",
  urgency: "NORMAL",
  feederBodyType: "DGSC",
  feederBodyCode: "DGSC-CS",
  studentRegNo: "REG-2022-001",
  supervisorEmpId: "EMP-CSE-001",
  programmeCode: "PHD-CS",
  receivedAt: new Date("2025-03-15"),
  casePayload: { title: "AI Ethics in Healthcare" },
};

const testStudent: StudentRecord = {
  id: "std-001",
  registrationNumber: "REG-2022-001",
  name: "Arun Kumar",
  programme: "PhD Computer Science",
  programmeType: "PhD",
  department: "Computer Science",
  enrollmentDate: new Date("2022-07-01"),
  status: "ACTIVE",
  supervisorEmpId: "EMP-CSE-001",
  courseworkCompleted: true,
  comprehensiveExamStatus: "PASSED",
  comprehensiveExamDate: new Date("2023-06-15"),
};

const testSupervisor: SupervisorRecord = {
  id: "sup-001",
  employeeId: "EMP-CSE-001",
  name: "Dr. Alice Johnson",
  department: "Computer Science",
  specialization: "Artificial Intelligence",
  highestQualification: { degree: "PhD", level: "Doctorate" },
  activeSupervisionCount: 3,
  maxSupervisionSlots: 5,
  publications: [
    { title: "Deep Learning for NLP", journal: "IEEE TPAMI", year: 2023, indexedIn: ["HEC-W", "Scopus", "ISI"] },
    { title: "Transformer Survey", journal: "ACM Surveys", year: 2024, indexedIn: ["HEC-W", "Scopus"] },
    { title: "Local Conference Paper", journal: "Local Journal", year: 2024, indexedIn: [] },
  ],
};

const testProgramme: ProgrammeRecord = {
  id: "prog-001",
  code: "PHD-CS",
  name: "PhD Computer Science",
  type: "PhD",
  department: "Computer Science",
  faculty: "Faculty of Computing",
  minimumDuration: 36,
  maximumDuration: 96,
  requiredCredits: 18,
  ruleParameters: {
    minHECPublications: 2,
    plagiarismThreshold: 19,
    requireComprehensiveExam: true,
  },
};

function makeCtx(overrides?: Partial<CaseContext>): CaseContext {
  const student = overrides?.student !== undefined ? overrides.student : testStudent;
  const supervisor = overrides?.supervisor !== undefined ? overrides.supervisor : testSupervisor;
  return {
    case: overrides?.case ?? testCase,
    student,
    supervisor,
    programme: overrides?.programme !== undefined ? overrides.programme : testProgramme,
    computed: overrides?.computed ?? buildComputedFields(student, supervisor),
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe("resolveRef", () => {
  const ctx = makeCtx();

  it("resolves case.caseType", () => {
    expect(resolveRef(ctx, "case.caseType")).toBe("SYNOPSIS_APPROVAL");
  });

  it("resolves student.enrollmentDate", () => {
    expect(resolveRef(ctx, "student.enrollmentDate")).toBeInstanceOf(Date);
  });

  it("resolves supervisor.highestQualification.level", () => {
    expect(resolveRef(ctx, "supervisor.highestQualification.level")).toBe("Doctorate");
  });

  it("resolves programme.ruleParameters.minHECPublications", () => {
    expect(resolveRef(ctx, "programme.ruleParameters.minHECPublications")).toBe(2);
  });

  it("resolves computed.remainingSlots", () => {
    expect(resolveRef(ctx, "computed.remainingSlots")).toBe(2);
  });

  it("returns undefined for missing path", () => {
    expect(resolveRef(ctx, "student.nonexistent")).toBeUndefined();
  });

  it("returns undefined when entity is null", () => {
    const ctx2 = makeCtx({ student: null });
    expect(resolveRef(ctx2, "student.name")).toBeUndefined();
  });
});

describe("buildComputedFields", () => {
  it("computes enrollmentDurationMonths", () => {
    const now = new Date("2025-03-15");
    const computed = buildComputedFields(testStudent, testSupervisor, now);
    // 2022-07-01 to 2025-03-15 ≈ 32 months
    expect(computed.enrollmentDurationMonths).toBeGreaterThanOrEqual(32);
    expect(computed.enrollmentDurationMonths).toBeLessThan(34);
  });

  it("computes remainingSlots", () => {
    const computed = buildComputedFields(testStudent, testSupervisor);
    expect(computed.remainingSlots).toBe(2);
  });

  it("computes publicationCount", () => {
    const computed = buildComputedFields(testStudent, testSupervisor);
    expect(computed.publicationCount).toBe(3);
  });

  it("handles null student", () => {
    const computed = buildComputedFields(null, testSupervisor);
    expect(computed.enrollmentDurationMonths).toBeUndefined();
    expect(computed.remainingSlots).toBe(2);
  });

  it("handles null supervisor", () => {
    const computed = buildComputedFields(testStudent, null);
    expect(computed.remainingSlots).toBeUndefined();
    expect(computed.publicationCount).toBeUndefined();
  });
});

describe("Predicate Evaluator", () => {
  // ─── Simple Comparisons ─────────────────────────────────────
  describe("comparison operators", () => {
    it("eq: passes when values match", () => {
      const result = evaluatePredicate(
        { eq: [{ ref: "case.caseType" }, "SYNOPSIS_APPROVAL"] },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });

    it("eq: fails when values differ", () => {
      const result = evaluatePredicate(
        { eq: [{ ref: "case.caseType" }, "GEC_CONSTITUTION"] },
        makeCtx()
      );
      expect(result.outcome).toBe(false);
    });

    it("ne: passes when values differ", () => {
      const result = evaluatePredicate(
        { ne: [{ ref: "student.status" }, "COMPLETED"] },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });

    it("gt: numeric comparison", () => {
      const result = evaluatePredicate(
        { gt: [{ ref: "supervisor.activeSupervisionCount" }, 2] },
        makeCtx()
      );
      expect(result.outcome).toBe(true); // 3 > 2
    });

    it("lt: numeric comparison", () => {
      const result = evaluatePredicate(
        { lt: [{ ref: "supervisor.activeSupervisionCount" }, 5] },
        makeCtx()
      );
      expect(result.outcome).toBe(true); // 3 < 5
    });

    it("gte: boundary", () => {
      const result = evaluatePredicate(
        { gte: [{ ref: "supervisor.activeSupervisionCount" }, 3] },
        makeCtx()
      );
      expect(result.outcome).toBe(true); // 3 >= 3
    });

    it("lte: boundary", () => {
      const result = evaluatePredicate(
        { lte: [{ ref: "supervisor.activeSupervisionCount" }, 3] },
        makeCtx()
      );
      expect(result.outcome).toBe(true); // 3 <= 3
    });

    it("eq: boolean comparison", () => {
      const result = evaluatePredicate(
        { eq: [{ ref: "student.courseworkCompleted" }, true] },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });
  });

  // ─── Logical Operators ──────────────────────────────────────
  describe("logical operators", () => {
    it("all: passes when all children pass", () => {
      const result = evaluatePredicate(
        {
          all: [
            { eq: [{ ref: "case.caseType" }, "SYNOPSIS_APPROVAL"] },
            { eq: [{ ref: "student.status" }, "ACTIVE"] },
          ],
        },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });

    it("all: fails when one child fails", () => {
      const result = evaluatePredicate(
        {
          all: [
            { eq: [{ ref: "case.caseType" }, "SYNOPSIS_APPROVAL"] },
            { eq: [{ ref: "student.status" }, "COMPLETED"] },
          ],
        },
        makeCtx()
      );
      expect(result.outcome).toBe(false);
    });

    it("any: passes when at least one child passes", () => {
      const result = evaluatePredicate(
        {
          any: [
            { eq: [{ ref: "student.programmeType" }, "MPhil"] },
            { eq: [{ ref: "student.programmeType" }, "PhD"] },
          ],
        },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });

    it("any: fails when no children pass", () => {
      const result = evaluatePredicate(
        {
          any: [
            { eq: [{ ref: "student.programmeType" }, "MPhil"] },
            { eq: [{ ref: "student.programmeType" }, "MSc"] },
          ],
        },
        makeCtx()
      );
      expect(result.outcome).toBe(false);
    });

    it("not: inverts result", () => {
      const result = evaluatePredicate(
        { not: { eq: [{ ref: "student.status" }, "COMPLETED"] } },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });
  });

  // ─── Set Operators ──────────────────────────────────────────
  describe("set operators", () => {
    it("in: value in list", () => {
      const result = evaluatePredicate(
        { in: [{ ref: "case.caseType" }, ["SYNOPSIS_APPROVAL", "GEC_CONSTITUTION"]] },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });

    it("in: value not in list", () => {
      const result = evaluatePredicate(
        { in: [{ ref: "case.caseType" }, ["GEC_CONSTITUTION", "RESULT_APPROVAL"]] },
        makeCtx()
      );
      expect(result.outcome).toBe(false);
    });

    it("not_in: value not in list", () => {
      const result = evaluatePredicate(
        { not_in: [{ ref: "student.programmeType" }, ["MSc", "MPhil"]] },
        makeCtx()
      );
      expect(result.outcome).toBe(true); // PhD not in [MSc, MPhil]
    });
  });

  // ─── Existence Operators ────────────────────────────────────
  describe("existence operators", () => {
    it("exists: passes for non-null field", () => {
      const result = evaluatePredicate(
        { exists: "student.supervisorEmpId" },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });

    it("exists: fails for null field", () => {
      const result = evaluatePredicate(
        { exists: "student.comprehensiveExamDate" },
        makeCtx({ student: { ...testStudent, comprehensiveExamDate: null, comprehensiveExamStatus: "NOT_TAKEN" } })
      );
      expect(result.outcome).toBe(false);
    });

    it("not_exists: passes for null field", () => {
      const noExamStudent = { ...testStudent, comprehensiveExamDate: null, comprehensiveExamStatus: "NOT_TAKEN" as const };
      const result = evaluatePredicate(
        { not_exists: "student.comprehensiveExamDate" },
        makeCtx({ student: noExamStudent })
      );
      expect(result.outcome).toBe(true);
    });
  });

  // ─── String Operators ──────────────────────────────────────
  describe("string operators", () => {
    it("matches_regex: matching pattern", () => {
      const result = evaluatePredicate(
        { matches_regex: [{ ref: "student.registrationNumber" }, "^REG-\\d{4}-\\d{3}$"] },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });

    it("matches_regex: non-matching pattern", () => {
      const result = evaluatePredicate(
        { matches_regex: [{ ref: "student.registrationNumber" }, "^INVALID"] },
        makeCtx()
      );
      expect(result.outcome).toBe(false);
    });

    it("contains: string in string", () => {
      const result = evaluatePredicate(
        { contains: [{ ref: "supervisor.specialization" }, "Artificial"] },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });

    it("contains: string not in string", () => {
      const result = evaluatePredicate(
        { contains: [{ ref: "supervisor.specialization" }, "Quantum"] },
        makeCtx()
      );
      expect(result.outcome).toBe(false);
    });
  });

  // ─── Safe Functions ─────────────────────────────────────────
  describe("safe functions", () => {
    it("len: counts array length", () => {
      const result = evaluatePredicate(
        { gte: [{ len: { ref: "supervisor.publications" } }, 2] },
        makeCtx()
      );
      expect(result.outcome).toBe(true); // 3 >= 2
    });

    it("len: counts string length", () => {
      const result = evaluatePredicate(
        { gt: [{ len: { ref: "student.name" } }, 5] },
        makeCtx()
      );
      expect(result.outcome).toBe(true); // "Arun Kumar" > 5
    });

    it("count_where: counts matching items", () => {
      // Count publications indexed in HEC-W
      const result = evaluatePredicate(
        {
          gte: [
            {
              count_where: {
                in: { ref: "supervisor.publications" },
                where: { contains: [{ ref: "item.indexedIn" }, "HEC-W"] },
              },
            },
            2,
          ],
        },
        makeCtx()
      );
      expect(result.outcome).toBe(true); // 2 HEC-W publications >= 2
    });

    it("count_where: zero matches", () => {
      const result = evaluatePredicate(
        {
          gte: [
            {
              count_where: {
                in: { ref: "supervisor.publications" },
                where: { contains: [{ ref: "item.indexedIn" }, "PubMed"] },
              },
            },
            1,
          ],
        },
        makeCtx()
      );
      expect(result.outcome).toBe(false); // 0 PubMed publications < 1
    });

    it("years_between: calculates years", () => {
      // Student enrolled 2022-07-01, evaluating relative to a fixed date
      const ctx = makeCtx({
        computed: {
          ...buildComputedFields(testStudent, testSupervisor),
        },
      });
      const result = evaluatePredicate(
        { gte: [{ years_between: [{ ref: "student.enrollmentDate" }, "2025-07-01"] }, 3] },
        ctx
      );
      expect(result.outcome).toBe(true); // 3 years >= 3
    });

    it("months_between: calculates months", () => {
      const result = evaluatePredicate(
        { gte: [{ months_between: [{ ref: "student.enrollmentDate" }, "2025-01-01"] }, 29] },
        makeCtx()
      );
      expect(result.outcome).toBe(true); // 30 months >= 29
    });

    it("lower: converts to lowercase", () => {
      const result = evaluatePredicate(
        { eq: [{ lower: { ref: "supervisor.department" } }, "computer science"] },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });

    it("upper: converts to uppercase", () => {
      const result = evaluatePredicate(
        { eq: [{ upper: { ref: "supervisor.department" } }, "COMPUTER SCIENCE"] },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });
  });

  // ─── Programme Rule Parameters ──────────────────────────────
  describe("programme rule parameters", () => {
    it("reads dynamic ruleParameters via ref", () => {
      const result = evaluatePredicate(
        { gte: [{ ref: "programme.ruleParameters.minHECPublications" }, 2] },
        makeCtx()
      );
      expect(result.outcome).toBe(true);
    });

    it("checks plagiarism threshold", () => {
      const result = evaluatePredicate(
        { lt: [15, { ref: "programme.ruleParameters.plagiarismThreshold" }] },
        makeCtx()
      );
      expect(result.outcome).toBe(true); // 15 < 19
    });
  });

  // ─── Evidence Collection ────────────────────────────────────
  describe("evidence collection", () => {
    it("collects ref values in evidence", () => {
      const result = evaluatePredicate(
        { eq: [{ ref: "student.status" }, "ACTIVE"] },
        makeCtx()
      );
      expect(result.evidence["student.status"]).toBe("ACTIVE");
    });

    it("collects exists check in evidence", () => {
      const result = evaluatePredicate(
        { exists: "student.supervisorEmpId" },
        makeCtx()
      );
      expect(result.evidence["student.supervisorEmpId"]).toBe("EMP-CSE-001");
    });
  });

  // ─── Error Handling ─────────────────────────────────────────
  describe("error handling", () => {
    it("throws EvaluationError for matches_regex on non-string", () => {
      expect(() =>
        evaluatePredicate(
          { matches_regex: [{ ref: "supervisor.activeSupervisionCount" }, "\\d+"] },
          makeCtx()
        )
      ).toThrow(EvaluationError);
    });

    it("throws EvaluationError for 'in' with non-array second operand", () => {
      expect(() =>
        evaluatePredicate(
          { in: [{ ref: "case.caseType" }, "not-an-array"] } as any,
          makeCtx()
        )
      ).toThrow(EvaluationError);
    });
  });

  // ─── Composite HEC-style Rule ───────────────────────────────
  describe("composite HEC-style rules", () => {
    it("HEC PhD supervisor qualification rule", () => {
      // Supervisor must have PhD AND at least 2 HEC-W publications
      const rule = {
        all: [
          { eq: [{ ref: "supervisor.highestQualification.level" }, "Doctorate"] },
          {
            gte: [
              {
                count_where: {
                  in: { ref: "supervisor.publications" },
                  where: { contains: [{ ref: "item.indexedIn" }, "HEC-W"] },
                },
              },
              { ref: "programme.ruleParameters.minHECPublications" },
            ],
          },
        ],
      };
      const result = evaluatePredicate(rule, makeCtx());
      expect(result.outcome).toBe(true);
    });

    it("HEC supervision cap rule", () => {
      // Supervisor must have remaining slots
      const rule = {
        lt: [
          { ref: "supervisor.activeSupervisionCount" },
          { ref: "supervisor.maxSupervisionSlots" },
        ],
      };
      const result = evaluatePredicate(rule, makeCtx());
      expect(result.outcome).toBe(true); // 3 < 5
    });

    it("HEC supervision cap rule fails when full", () => {
      const fullSupervisor = { ...testSupervisor, activeSupervisionCount: 5 };
      const result = evaluatePredicate(
        {
          lt: [
            { ref: "supervisor.activeSupervisionCount" },
            { ref: "supervisor.maxSupervisionSlots" },
          ],
        },
        makeCtx({ supervisor: fullSupervisor })
      );
      expect(result.outcome).toBe(false); // 5 < 5 = false
    });

    it("coursework + comprehensive exam prerequisite check", () => {
      const rule = {
        all: [
          { eq: [{ ref: "student.courseworkCompleted" }, true] },
          { eq: [{ ref: "student.comprehensiveExamStatus" }, "PASSED"] },
        ],
      };
      const result = evaluatePredicate(rule, makeCtx());
      expect(result.outcome).toBe(true);
    });

    it("coursework prerequisite fails for incomplete student", () => {
      const incompleteStudent = { ...testStudent, courseworkCompleted: false };
      const result = evaluatePredicate(
        {
          all: [
            { eq: [{ ref: "student.courseworkCompleted" }, true] },
            { eq: [{ ref: "student.comprehensiveExamStatus" }, "PASSED"] },
          ],
        },
        makeCtx({ student: incompleteStudent })
      );
      expect(result.outcome).toBe(false);
    });
  });
});
