/**
 * CaseContext — The runtime data bag passed to the predicate evaluator.
 *
 * Built from an ASRBCase record + reader lookups. Every `{ ref: "path" }`
 * in a predicate resolves against this context.
 *
 * Structure mirrors the attribute-path catalog prefixes:
 *   case.*        → from ASRBCase model
 *   student.*     → from IStudentAcademicReader
 *   supervisor.*  → from ISupervisorProfileReader
 *   programme.*   → from IProgrammeProfileReader
 *   computed.*    → derived at build time
 */

import type { StudentRecord, SupervisorRecord, ProgrammeRecord } from "@ums/source-data";

/**
 * Minimal case fields needed by the evaluator.
 * This is a projection of the Prisma ASRBCase model — we don't
 * import Prisma types directly to keep the compliance package
 * decoupled from the ORM layer.
 */
export interface CaseSnapshot {
  caseType: string;
  status: string;
  urgency: string;
  feederBodyType: string;
  feederBodyCode: string;
  studentRegNo: string | null;
  supervisorEmpId: string | null;
  programmeCode: string | null;
  receivedAt: Date;
  /** The raw JSON case payload, already parsed into a JS object. */
  casePayload: Record<string, unknown>;
}

/**
 * Full evaluation context. Each top-level key corresponds to an
 * attribute-catalog source prefix.
 */
export interface CaseContext {
  case: CaseSnapshot;
  student: StudentRecord | null;
  supervisor: SupervisorRecord | null;
  programme: ProgrammeRecord | null;
  computed: Record<string, unknown>;
}

/**
 * Build computed fields from the raw reader data.
 */
export function buildComputedFields(
  student: StudentRecord | null,
  supervisor: SupervisorRecord | null,
  now: Date = new Date()
): Record<string, unknown> {
  const computed: Record<string, unknown> = {};

  if (student) {
    const diffMs = now.getTime() - student.enrollmentDate.getTime();
    computed.enrollmentDurationMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  }

  if (supervisor) {
    computed.remainingSlots = supervisor.maxSupervisionSlots - supervisor.activeSupervisionCount;
    computed.publicationCount = supervisor.publications.length;
  }

  return computed;
}

/**
 * Resolve a dotted attribute path against the CaseContext.
 *
 * @param ctx The evaluation context
 * @param path Dotted path like "student.enrollmentDate" or "programme.ruleParameters.minHECPublications"
 * @returns The resolved value, or undefined if the path doesn't exist
 */
export function resolveRef(ctx: CaseContext, path: string): unknown {
  const segments = path.split(".");
  if (segments.length < 2) return undefined;

  const prefix = segments[0] as keyof CaseContext;
  const root = ctx[prefix];
  if (root === null || root === undefined) return undefined;

  // Walk the object tree
  let current: unknown = root;
  for (let i = 1; i < segments.length; i++) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segments[i]];
  }

  return current;
}
