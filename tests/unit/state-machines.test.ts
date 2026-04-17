import { describe, it, expect } from "vitest";
import {
  canTransitionAgendaItem,
  canTransitionWorkingPaper,
  canTransitionActionTakenEntry,
  AgendaItemStatus,
  WorkingPaperStatus,
  ActionTakenEntryStatus,
} from "@ums/domain";

describe("State Machines", () => {
  describe("AgendaItem Transitions", () => {
    it("should transition from DRAFT to SUBMITTED", () => {
      expect(
        canTransitionAgendaItem(
          AgendaItemStatus.DRAFT,
          AgendaItemStatus.SUBMITTED
        )
      ).toBe(true);
    });

    it("should transition from DRAFT to WITHDRAWN", () => {
      expect(
        canTransitionAgendaItem(
          AgendaItemStatus.DRAFT,
          AgendaItemStatus.WITHDRAWN
        )
      ).toBe(true);
    });

    it("should not transition from DRAFT to DECIDED", () => {
      expect(
        canTransitionAgendaItem(
          AgendaItemStatus.DRAFT,
          AgendaItemStatus.DECIDED
        )
      ).toBe(false);
    });

    it("should transition from SUBMITTED to VETTED", () => {
      expect(
        canTransitionAgendaItem(
          AgendaItemStatus.SUBMITTED,
          AgendaItemStatus.VETTED
        )
      ).toBe(true);
    });

    it("should transition from SUBMITTED to RETURNED", () => {
      expect(
        canTransitionAgendaItem(
          AgendaItemStatus.SUBMITTED,
          AgendaItemStatus.RETURNED
        )
      ).toBe(true);
    });

    it("should transition from RETURNED to DRAFT", () => {
      expect(
        canTransitionAgendaItem(
          AgendaItemStatus.RETURNED,
          AgendaItemStatus.DRAFT
        )
      ).toBe(true);
    });

    it("should not allow transitions from CLOSED", () => {
      expect(
        canTransitionAgendaItem(
          AgendaItemStatus.CLOSED,
          AgendaItemStatus.DRAFT
        )
      ).toBe(false);
    });
  });

  describe("WorkingPaper Transitions", () => {
    it("should transition from INSTANTIATED to IN_AUTHORING", () => {
      expect(
        canTransitionWorkingPaper(
          WorkingPaperStatus.INSTANTIATED,
          WorkingPaperStatus.IN_AUTHORING
        )
      ).toBe(true);
    });

    it("should transition from IN_AUTHORING to IN_REVIEW", () => {
      expect(
        canTransitionWorkingPaper(
          WorkingPaperStatus.IN_AUTHORING,
          WorkingPaperStatus.IN_REVIEW
        )
      ).toBe(true);
    });

    it("should transition from IN_REVIEW back to IN_AUTHORING", () => {
      expect(
        canTransitionWorkingPaper(
          WorkingPaperStatus.IN_REVIEW,
          WorkingPaperStatus.IN_AUTHORING
        )
      ).toBe(true);
    });

    it("should transition from FINALIZED to CIRCULATED", () => {
      expect(
        canTransitionWorkingPaper(
          WorkingPaperStatus.FINALIZED,
          WorkingPaperStatus.CIRCULATED
        )
      ).toBe(true);
    });

    it("should not allow transitions from ARCHIVED", () => {
      expect(
        canTransitionWorkingPaper(
          WorkingPaperStatus.ARCHIVED,
          WorkingPaperStatus.FINALIZED
        )
      ).toBe(false);
    });
  });

  describe("ActionTakenEntry Transitions", () => {
    it("should transition from OPEN to IN_PROGRESS", () => {
      expect(
        canTransitionActionTakenEntry(
          ActionTakenEntryStatus.OPEN,
          ActionTakenEntryStatus.IN_PROGRESS
        )
      ).toBe(true);
    });

    it("should transition from OPEN to BLOCKED", () => {
      expect(
        canTransitionActionTakenEntry(
          ActionTakenEntryStatus.OPEN,
          ActionTakenEntryStatus.BLOCKED
        )
      ).toBe(true);
    });

    it("should transition from IN_PROGRESS to CLOSED", () => {
      expect(
        canTransitionActionTakenEntry(
          ActionTakenEntryStatus.IN_PROGRESS,
          ActionTakenEntryStatus.CLOSED
        )
      ).toBe(true);
    });

    it("should transition from BLOCKED back to IN_PROGRESS", () => {
      expect(
        canTransitionActionTakenEntry(
          ActionTakenEntryStatus.BLOCKED,
          ActionTakenEntryStatus.IN_PROGRESS
        )
      ).toBe(true);
    });

    it("should not allow transitions from CLOSED", () => {
      expect(
        canTransitionActionTakenEntry(
          ActionTakenEntryStatus.CLOSED,
          ActionTakenEntryStatus.IN_PROGRESS
        )
      ).toBe(false);
    });
  });
});
