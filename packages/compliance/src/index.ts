/**
 * @ums/compliance — Compliance Rules Catalog, Predicate Language, and Evaluation Engine
 *
 * Public API surface for the ASRB compliance package.
 */

// ─── Predicate Grammar ──────────────────────────────────────────
export {
  PredicateNodeSchema,
  OperandSchema,
  RefSchema,
  SafeFunctionSchema,
  LiteralSchema,
  LiteralArraySchema,
  getNodeType,
  isRef,
  isSafeFunction,
  isLogicalOp,
  isComparisonOp,
  isSetOp,
  isExistenceOp,
  isStringOp,
  ALL_NODE_TYPES,
} from "./predicate/grammar"

export type {
  PredicateNode,
  Operand,
  Ref,
  Literal,
  LiteralArray,
  SafeFunction,
  AllNode,
  AnyNode,
  NotNode,
  ComparisonNode,
  ComparisonOp,
  InNode,
  NotInNode,
  ExistsNode,
  NotExistsNode,
  MatchesRegexNode,
  ContainsNode,
  LenFunction,
  CountWhereFunction,
  YearsBetweenFunction,
  MonthsBetweenFunction,
  TodayFunction,
  LowerFunction,
  UpperFunction,
  InstitutionRecognizedFunction,
} from "./predicate/grammar"

// ─── Predicate Validator ────────────────────────────────────────
export {
  validatePredicate,
} from "./predicate/validator"

export type {
  ValidationError,
  ValidationResult,
  ValidatorOptions,
} from "./predicate/validator"

// ─── Attribute Catalog ──────────────────────────────────────────
export {
  getAttributeCatalog,
  resetAttributeCatalog,
  getAttributeEntries,
  getAttributeEntriesBySource,
  resolveAttributePath,
} from "./predicate/attribute-catalog"

export type {
  AttributeType,
  AttributeEntry,
} from "./predicate/attribute-catalog"

// ─── Case Context ───────────────────────────────────────────────
export {
  buildComputedFields,
  resolveRef,
} from "./predicate/case-context"

export type {
  CaseSnapshot,
  CaseContext,
} from "./predicate/case-context"

// ─── Predicate Evaluator ────────────────────────────────────────
export {
  evaluatePredicate,
  EvaluationError,
} from "./predicate/evaluator"

export type {
  EvaluationResult,
} from "./predicate/evaluator"

// ─── Catalog Service ────────────────────────────────────────────
export {
  CatalogService,
  CatalogServiceError,
} from "./catalog/catalog-service"

export type {
  ComplianceRuleRecord,
  CreateRuleInput,
  UpdateRuleInput,
  IRuleStore,
  RuleFilter,
  RuleStatus,
  ConflictInfo,
} from "./catalog/types"

// ─── Memory Store (for tests / development) ─────────────────────
export { MemoryRuleStore } from "./catalog/memory-store"
