/**
 * Attribute-Path Catalog
 *
 * A typed registry of valid ref paths that compliance rules can reference.
 * Used by the validator to reject unknown attribute paths at authoring time,
 * and by the predicate builder UI to offer auto-complete suggestions.
 *
 * Paths follow a dotted notation: "student.enrollmentDate", "supervisor.highestQualification.level".
 * Map-type paths (e.g. "programme.ruleParameters") accept any sub-key at runtime.
 */

export type AttributeType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "string[]"
  | "number[]"
  | "object"
  | "object[]"
  | "map";

export interface AttributeEntry {
  path: string;
  type: AttributeType;
  description: string;
  /** If true, this path is a map and any sub-key is valid */
  isMap?: boolean;
  /** Source reader or context that populates this path */
  source: "case" | "student" | "supervisor" | "programme" | "computed";
}

// ─── Case-Level Attributes ──────────────────────────────────────

const CASE_ATTRIBUTES: AttributeEntry[] = [
  { path: "case.caseType", type: "string", description: "ASRB case type enum value", source: "case" },
  { path: "case.status", type: "string", description: "Current case status", source: "case" },
  { path: "case.urgency", type: "string", description: "Case urgency level (NORMAL or URGENT_CIRCULATION)", source: "case" },
  { path: "case.feederBodyType", type: "string", description: "Feeder body type (DGSC or FACULTY_BOARD)", source: "case" },
  { path: "case.feederBodyCode", type: "string", description: "Feeder body code identifier", source: "case" },
  { path: "case.studentRegNo", type: "string", description: "Student registration number from the case", source: "case" },
  { path: "case.supervisorEmpId", type: "string", description: "Supervisor employee ID from the case", source: "case" },
  { path: "case.programmeCode", type: "string", description: "Programme code from the case", source: "case" },
  { path: "case.receivedAt", type: "date", description: "Date the case was received", source: "case" },
];

// ─── Student Attributes ─────────────────────────────────────────

const STUDENT_ATTRIBUTES: AttributeEntry[] = [
  { path: "student.registrationNumber", type: "string", description: "Student registration number", source: "student" },
  { path: "student.name", type: "string", description: "Student full name", source: "student" },
  { path: "student.programme", type: "string", description: "Programme name", source: "student" },
  { path: "student.programmeType", type: "string", description: "Programme type (PhD, MPhil, MSc, etc.)", source: "student" },
  { path: "student.department", type: "string", description: "Student's department", source: "student" },
  { path: "student.enrollmentDate", type: "date", description: "Date of enrollment", source: "student" },
  { path: "student.status", type: "string", description: "Student status (ACTIVE, COMPLETED, etc.)", source: "student" },
  { path: "student.supervisorEmpId", type: "string", description: "Assigned supervisor employee ID", source: "student" },
  { path: "student.courseworkCompleted", type: "boolean", description: "Whether required coursework is completed", source: "student" },
  { path: "student.comprehensiveExamStatus", type: "string", description: "Comprehensive exam status (NOT_TAKEN, PASSED, FAILED)", source: "student" },
  { path: "student.comprehensiveExamDate", type: "date", description: "Date of comprehensive exam (if taken)", source: "student" },
];

// ─── Supervisor Attributes ──────────────────────────────────────

const SUPERVISOR_ATTRIBUTES: AttributeEntry[] = [
  { path: "supervisor.employeeId", type: "string", description: "Supervisor employee ID", source: "supervisor" },
  { path: "supervisor.name", type: "string", description: "Supervisor full name", source: "supervisor" },
  { path: "supervisor.department", type: "string", description: "Supervisor's department", source: "supervisor" },
  { path: "supervisor.specialization", type: "string", description: "Research specialization area", source: "supervisor" },
  { path: "supervisor.highestQualification.degree", type: "string", description: "Highest degree name (e.g. PhD)", source: "supervisor" },
  { path: "supervisor.highestQualification.level", type: "string", description: "Qualification level (e.g. Doctorate)", source: "supervisor" },
  { path: "supervisor.activeSupervisionCount", type: "number", description: "Number of currently supervised students", source: "supervisor" },
  { path: "supervisor.maxSupervisionSlots", type: "number", description: "Maximum allowed supervision slots", source: "supervisor" },
  { path: "supervisor.publications", type: "object[]", description: "Array of publication records", source: "supervisor" },
];

// ─── Programme Attributes ───────────────────────────────────────

const PROGRAMME_ATTRIBUTES: AttributeEntry[] = [
  { path: "programme.code", type: "string", description: "Programme code identifier", source: "programme" },
  { path: "programme.name", type: "string", description: "Programme full name", source: "programme" },
  { path: "programme.type", type: "string", description: "Programme type (PhD, MPhil, MSc, etc.)", source: "programme" },
  { path: "programme.department", type: "string", description: "Offering department", source: "programme" },
  { path: "programme.faculty", type: "string", description: "Faculty/school", source: "programme" },
  { path: "programme.minimumDuration", type: "number", description: "Minimum programme duration in months", source: "programme" },
  { path: "programme.maximumDuration", type: "number", description: "Maximum programme duration in months", source: "programme" },
  { path: "programme.requiredCredits", type: "number", description: "Total required credits", source: "programme" },
  { path: "programme.ruleParameters", type: "map", description: "Programme-specific rule parameters (map; any sub-key valid)", source: "programme", isMap: true },
];

// ─── Computed / Derived Attributes ──────────────────────────────

const COMPUTED_ATTRIBUTES: AttributeEntry[] = [
  { path: "computed.enrollmentDurationMonths", type: "number", description: "Months since enrollment (computed from student.enrollmentDate)", source: "computed" },
  { path: "computed.remainingSlots", type: "number", description: "supervisor.maxSupervisionSlots - supervisor.activeSupervisionCount", source: "computed" },
  { path: "computed.publicationCount", type: "number", description: "Length of supervisor.publications array", source: "computed" },
];

// ─── Catalog Assembly ───────────────────────────────────────────

const ALL_ATTRIBUTES: AttributeEntry[] = [
  ...CASE_ATTRIBUTES,
  ...STUDENT_ATTRIBUTES,
  ...SUPERVISOR_ATTRIBUTES,
  ...PROGRAMME_ATTRIBUTES,
  ...COMPUTED_ATTRIBUTES,
];

/**
 * Build the catalog map. Keys are attribute paths, values are entries.
 * Map-type entries (isMap: true) match any sub-key at validation time.
 */
function buildCatalog(): Map<string, AttributeEntry> {
  const catalog = new Map<string, AttributeEntry>();
  for (const entry of ALL_ATTRIBUTES) {
    catalog.set(entry.path, entry);
  }
  return catalog;
}

let _catalog: Map<string, AttributeEntry> | null = null;

/**
 * Get the global attribute catalog (lazy-initialized singleton).
 * The validator calls this to check ref path validity.
 */
export function getAttributeCatalog(): Map<string, AttributeEntry> {
  if (!_catalog) {
    _catalog = buildCatalog();
  }
  return _catalog;
}

/**
 * Reset the catalog (useful for testing with custom catalogs).
 */
export function resetAttributeCatalog(): void {
  _catalog = null;
}

/**
 * Get all attribute entries as an array (useful for UI auto-complete).
 */
export function getAttributeEntries(): AttributeEntry[] {
  return [...ALL_ATTRIBUTES];
}

/**
 * Get attribute entries filtered by source.
 */
export function getAttributeEntriesBySource(source: AttributeEntry["source"]): AttributeEntry[] {
  return ALL_ATTRIBUTES.filter((e) => e.source === source);
}

/**
 * Look up a single attribute entry by path.
 * For map-type paths like "programme.ruleParameters.plagiarismThreshold",
 * this resolves to the base map entry "programme.ruleParameters".
 */
export function resolveAttributePath(path: string): AttributeEntry | null {
  const catalog = getAttributeCatalog();

  // Direct lookup
  const direct = catalog.get(path);
  if (direct) return direct;

  // Map-type resolution: walk up the path to find a map parent
  const segments = path.split(".");
  for (let i = segments.length - 1; i >= 1; i--) {
    const parentPath = segments.slice(0, i).join(".");
    const parent = catalog.get(parentPath);
    if (parent?.isMap) return parent;
  }

  return null;
}
