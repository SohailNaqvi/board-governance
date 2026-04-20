import { describe, it, expect } from "vitest";
import {
  canTransitionComplianceEvaluation,
  complianceEvaluationTransitionMatrix,
  ComplianceEvaluationStatus,
} from "@ums/domain";

describe("ComplianceEvaluation State Machine", () => {
  describe("Valid transitions", () => {
    it("should allow IN_PROGRESS → COMPLETE", () => {
      expect(
        canTransitionComplianceEvaluation(
          ComplianceEvaluationStatus.IN_PROGRESS,
          ComplianceEvaluationStatus.COMPLETE
        )
      ).toBe(true);
    });
  });

  describe("Invalid transitions", () => {
    it("should not allow COMPLETE → IN_PROGRESS", () => {
      expect(
        canTransitionComplianceEvaluation(
          ComplianceEvaluationStatus.COMPLETE,
          ComplianceEvaluationStatus.IN_PROGRESS
        )
      ).toBe(false);
    });

    it("should not allow IN_PROGRESS → IN_PROGRESS (self-transition)", () => {
      expect(
        canTransitionComplianceEvaluation(
          ComplianceEvaluationStatus.IN_PROGRESS,
          ComplianceEvaluationStatus.IN_PROGRESS
        )
      ).toBe(false);
    });

    it("should not allow COMPLETE → COMPLETE (self-transition)", () => {
      expect(
        canTransitionComplianceEvaluation(
          ComplianceEvaluationStatus.COMPLETE,
          ComplianceEvaluationStatus.COMPLETE
        )
      ).toBe(false);
    });
  });

  describe("Transition matrix exhaustiveness", () => {
    it("should have entries for all ComplianceEvaluationStatus values", () => {
      const allStatuses = Object.values(ComplianceEvaluationStatus);
      const matrixKeys = Object.keys(complianceEvaluationTransitionMatrix);
      expect(matrixKeys.sort()).toEqual(allStatuses.sort());
    });

    it("should have exactly 1 valid transition from IN_PROGRESS", () => {
      const transitions =
        complianceEvaluationTransitionMatrix[ComplianceEvaluationStatus.IN_PROGRESS];
      expect(transitions).toHaveLength(1);
      expect(transitions[0]).toBe(ComplianceEvaluationStatus.COMPLETE);
    });

    it("should have 0 valid transitions from COMPLETE (terminal state)", () => {
      const transitions =
        complianceEvaluationTransitionMatrix[ComplianceEvaluationStatus.COMPLETE];
      expect(transitions).toHaveLength(0);
    });
  });

  describe("Full matrix test", () => {
    const allStatuses = Object.values(ComplianceEvaluationStatus);

    for (const from of allStatuses) {
      for (const to of allStatuses) {
        const expected =
          from === ComplianceEvaluationStatus.IN_PROGRESS &&
          to === ComplianceEvaluationStatus.COMPLETE;
        it(`${from} → ${to} should be ${expected}`, () => {
          expect(canTransitionComplianceEvaluation(from, to)).toBe(expected);
        });
      }
    }
  });
});
