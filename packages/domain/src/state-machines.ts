import {
  AgendaItemStatus,
  WorkingPaperStatus,
  ActionTakenEntryStatus,
  ASRBCaseStatus,
} from "./enums";

// Transition matrices for state machines

const agendaItemTransitions: Record<AgendaItemStatus, AgendaItemStatus[]> = {
  [AgendaItemStatus.DRAFT]: [
    AgendaItemStatus.SUBMITTED,
    AgendaItemStatus.WITHDRAWN,
  ],
  [AgendaItemStatus.SUBMITTED]: [
    AgendaItemStatus.VETTED,
    AgendaItemStatus.RETURNED,
    AgendaItemStatus.WITHDRAWN,
  ],
  [AgendaItemStatus.VETTED]: [
    AgendaItemStatus.APPROVED_FOR_AGENDA,
    AgendaItemStatus.RETURNED,
    AgendaItemStatus.WITHDRAWN,
  ],
  [AgendaItemStatus.APPROVED_FOR_AGENDA]: [
    AgendaItemStatus.CIRCULATED,
    AgendaItemStatus.WITHDRAWN,
  ],
  [AgendaItemStatus.CIRCULATED]: [
    AgendaItemStatus.DECIDED,
    AgendaItemStatus.DEFERRED,
    AgendaItemStatus.WITHDRAWN,
  ],
  [AgendaItemStatus.DECIDED]: [AgendaItemStatus.CLOSED],
  [AgendaItemStatus.CLOSED]: [],
  [AgendaItemStatus.RETURNED]: [
    AgendaItemStatus.DRAFT,
    AgendaItemStatus.WITHDRAWN,
  ],
  [AgendaItemStatus.DEFERRED]: [
    AgendaItemStatus.CIRCULATED,
    AgendaItemStatus.WITHDRAWN,
  ],
  [AgendaItemStatus.WITHDRAWN]: [],
};

const workingPaperTransitions: Record<WorkingPaperStatus, WorkingPaperStatus[]> =
  {
    [WorkingPaperStatus.INSTANTIATED]: [
      WorkingPaperStatus.IN_AUTHORING,
    ],
    [WorkingPaperStatus.IN_AUTHORING]: [
      WorkingPaperStatus.IN_REVIEW,
    ],
    [WorkingPaperStatus.IN_REVIEW]: [
      WorkingPaperStatus.FINALIZED,
      WorkingPaperStatus.IN_AUTHORING,
    ],
    [WorkingPaperStatus.FINALIZED]: [
      WorkingPaperStatus.CIRCULATED,
      WorkingPaperStatus.ARCHIVED,
    ],
    [WorkingPaperStatus.CIRCULATED]: [
      WorkingPaperStatus.ARCHIVED,
    ],
    [WorkingPaperStatus.ARCHIVED]: [],
  };

const actionTakenEntryTransitions: Record<
  ActionTakenEntryStatus,
  ActionTakenEntryStatus[]
> = {
  [ActionTakenEntryStatus.OPEN]: [
    ActionTakenEntryStatus.IN_PROGRESS,
    ActionTakenEntryStatus.BLOCKED,
  ],
  [ActionTakenEntryStatus.IN_PROGRESS]: [
    ActionTakenEntryStatus.BLOCKED,
    ActionTakenEntryStatus.CLOSED,
  ],
  [ActionTakenEntryStatus.BLOCKED]: [
    ActionTakenEntryStatus.IN_PROGRESS,
  ],
  [ActionTakenEntryStatus.CLOSED]: [],
};

export function canTransitionAgendaItem(
  from: AgendaItemStatus,
  to: AgendaItemStatus
): boolean {
  const validTransitions = agendaItemTransitions[from] || [];
  return validTransitions.includes(to);
}

export function canTransitionWorkingPaper(
  from: WorkingPaperStatus,
  to: WorkingPaperStatus
): boolean {
  const validTransitions = workingPaperTransitions[from] || [];
  return validTransitions.includes(to);
}

export function canTransitionActionTakenEntry(
  from: ActionTakenEntryStatus,
  to: ActionTakenEntryStatus
): boolean {
  const validTransitions = actionTakenEntryTransitions[from] || [];
  return validTransitions.includes(to);
}

const asrbCaseTransitions: Record<ASRBCaseStatus, ASRBCaseStatus[]> = {
  [ASRBCaseStatus.RECEIVED]: [
    ASRBCaseStatus.COMPLIANCE_EVALUATED,
    ASRBCaseStatus.RETURNED,
    ASRBCaseStatus.WITHDRAWN,
  ],
  [ASRBCaseStatus.COMPLIANCE_EVALUATED]: [
    ASRBCaseStatus.VETTING,
    ASRBCaseStatus.RETURNED,
    ASRBCaseStatus.URGENT_CIRCULATION,
    ASRBCaseStatus.WITHDRAWN,
  ],
  [ASRBCaseStatus.VETTING]: [
    ASRBCaseStatus.READY_FOR_AGENDA,
    ASRBCaseStatus.RETURNED,
    ASRBCaseStatus.HELD,
    ASRBCaseStatus.WITHDRAWN,
  ],
  [ASRBCaseStatus.READY_FOR_AGENDA]: [
    ASRBCaseStatus.ON_AGENDA,
    ASRBCaseStatus.HELD,
    ASRBCaseStatus.WITHDRAWN,
  ],
  [ASRBCaseStatus.ON_AGENDA]: [
    ASRBCaseStatus.DECIDED,
    ASRBCaseStatus.DEFERRED,
    ASRBCaseStatus.WITHDRAWN,
  ],
  [ASRBCaseStatus.DECIDED]: [ASRBCaseStatus.CLOSED],
  [ASRBCaseStatus.URGENT_CIRCULATION]: [
    ASRBCaseStatus.DECIDED,
    ASRBCaseStatus.RETURNED,
    ASRBCaseStatus.WITHDRAWN,
  ],
  [ASRBCaseStatus.HELD]: [
    ASRBCaseStatus.READY_FOR_AGENDA,
    ASRBCaseStatus.WITHDRAWN,
  ],
  [ASRBCaseStatus.RETURNED]: [
    ASRBCaseStatus.COMPLIANCE_EVALUATED,
    ASRBCaseStatus.WITHDRAWN,
  ],
  [ASRBCaseStatus.DEFERRED]: [
    ASRBCaseStatus.ON_AGENDA,
    ASRBCaseStatus.WITHDRAWN,
  ],
  [ASRBCaseStatus.CLOSED]: [],
  [ASRBCaseStatus.WITHDRAWN]: [],
};

export function canTransitionASRBCase(
  from: ASRBCaseStatus,
  to: ASRBCaseStatus
): boolean {
  const validTransitions = asrbCaseTransitions[from] || [];
  return validTransitions.includes(to);
}

export const agendaItemTransitionMatrix = agendaItemTransitions;
export const workingPaperTransitionMatrix = workingPaperTransitions;
export const actionTakenEntryTransitionMatrix = actionTakenEntryTransitions;
export const asrbCaseTransitionMatrix = asrbCaseTransitions;
