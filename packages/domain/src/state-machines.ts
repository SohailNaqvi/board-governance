import {
  AgendaItemStatus,
  WorkingPaperStatus,
  ActionTakenEntryStatus,
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

export const agendaItemTransitionMatrix = agendaItemTransitions;
export const workingPaperTransitionMatrix = workingPaperTransitions;
export const actionTakenEntryTransitionMatrix = actionTakenEntryTransitions;
