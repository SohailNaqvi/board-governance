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
} from "./predicate/grammar.js";

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
} from "./predicate/grammar.js";

// ─── Predicate Validator ────────────────────────────────────────
export {
  validatePredicate,
} from "./predicate/validator.js";

export type {
  ValidationError,
  ValidationResult,
  ValidatorOptions,
} from "./predicate/validator.js";

// ─── Attribute Catalog ──────────────────────────────────────────
export {
  getAttributeCatalog,
  resetAttributeCatalog,
  getAttributeEntries,
  getAttributeEntriesBySource,
  resolveAttributePath,
} from "./predicate/attribute-catalog.js";

export type {
  AttributeType,
  AttributeEntry,
} from "./predicate/attribute-catalog.js";
