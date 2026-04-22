/**
 * Predicate Language Grammar
 *
 * A restricted JSON expression language for compliance rules.
 * Intentionally non-Turing-complete: no loops, no variables, no function definitions.
 *
 * Top-level form: a JSON object with exactly one key indicating the node type.
 * Node types: logical (all, any, not), comparison (eq, ne, gt, lt, gte, lte),
 * set (in, not_in), existence (exists, not_exists), string (matches_regex, contains).
 *
 * Operands: literals (string, number, boolean, null, arrays), references ({ ref: "path" }),
 * or safe function calls (len, count_where, years_between, months_between, today, lower, upper,
 * institution_recognized).
 */

import { z } from "zod";

// ─── Operand Types ───────────────────────────────────────────────

/** A reference to a case attribute or reader output */
export const RefSchema = z.object({
  ref: z.string().min(1),
});
export type Ref = z.infer<typeof RefSchema>;

/** JSON literal values */
export const LiteralSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
export type Literal = z.infer<typeof LiteralSchema>;

/** Array of literals */
export const LiteralArraySchema = z.array(LiteralSchema);
export type LiteralArray = z.infer<typeof LiteralArraySchema>;

// ─── Forward declaration for recursive types ─────────────────────

// We use z.lazy for recursive schemas.
// TypeScript types are declared manually for clarity.

export type Operand =
  | Literal
  | Literal[]
  | Ref
  | SafeFunction;

export type PredicateNode =
  | AllNode
  | AnyNode
  | NotNode
  | ComparisonNode
  | InNode
  | NotInNode
  | ExistsNode
  | NotExistsNode
  | MatchesRegexNode
  | ContainsNode;

// ─── Logical Composition Nodes ───────────────────────────────────

export interface AllNode {
  all: PredicateNode[];
}

export interface AnyNode {
  any: PredicateNode[];
}

export interface NotNode {
  not: PredicateNode;
}

// ─── Comparison Nodes ────────────────────────────────────────────

export type ComparisonOp = "eq" | "ne" | "gt" | "lt" | "gte" | "lte";

export interface ComparisonNode {
  [op: string]: [Operand, Operand];
}

// ─── Set Nodes ───────────────────────────────────────────────────

export interface InNode {
  in: [Operand, Operand];
}

export interface NotInNode {
  not_in: [Operand, Operand];
}

// ─── Existence Nodes ─────────────────────────────────────────────

export interface ExistsNode {
  exists: string;
}

export interface NotExistsNode {
  not_exists: string;
}

// ─── String Nodes ────────────────────────────────────────────────

export interface MatchesRegexNode {
  matches_regex: [Operand, string];
}

export interface ContainsNode {
  contains: [Operand, Operand];
}

// ─── Safe Functions ──────────────────────────────────────────────

export type SafeFunction =
  | LenFunction
  | CountWhereFunction
  | YearsBetweenFunction
  | MonthsBetweenFunction
  | TodayFunction
  | LowerFunction
  | UpperFunction
  | InstitutionRecognizedFunction;

export interface LenFunction {
  len: Operand;
}

export interface CountWhereFunction {
  count_where: {
    in: Operand;
    where: PredicateNode;
  };
}

export interface YearsBetweenFunction {
  years_between: [Operand, Operand];
}

export interface MonthsBetweenFunction {
  months_between: [Operand, Operand];
}

export interface TodayFunction {
  today: Record<string, never>;
}

export interface LowerFunction {
  lower: Operand;
}

export interface UpperFunction {
  upper: Operand;
}

export interface InstitutionRecognizedFunction {
  institution_recognized: {
    name: Operand;
    country: Operand;
  };
}

// ─── Zod Schemas (recursive) ────────────────────────────────────

// Safe function schemas (forward-declared for recursion)
const LenSchema: z.ZodType<LenFunction> = z.object({
  len: z.lazy(() => OperandSchema),
});

const CountWhereSchema: z.ZodType<CountWhereFunction> = z.object({
  count_where: z.object({
    in: z.lazy(() => OperandSchema),
    where: z.lazy(() => PredicateNodeSchema),
  }),
});

const YearsBetweenSchema: z.ZodType<YearsBetweenFunction> = z.object({
  years_between: z.tuple([
    z.lazy(() => OperandSchema),
    z.lazy(() => OperandSchema),
  ]),
});

const MonthsBetweenSchema: z.ZodType<MonthsBetweenFunction> = z.object({
  months_between: z.tuple([
    z.lazy(() => OperandSchema),
    z.lazy(() => OperandSchema),
  ]),
});

const TodaySchema: z.ZodType<TodayFunction> = z.object({
  today: z.object({}).strict(),
});

const LowerSchema: z.ZodType<LowerFunction> = z.object({
  lower: z.lazy(() => OperandSchema),
});

const UpperSchema: z.ZodType<UpperFunction> = z.object({
  upper: z.lazy(() => OperandSchema),
});

const InstitutionRecognizedSchema: z.ZodType<InstitutionRecognizedFunction> = z.object({
  institution_recognized: z.object({
    name: z.lazy(() => OperandSchema),
    country: z.lazy(() => OperandSchema),
  }),
});

export const SafeFunctionSchema: z.ZodType<SafeFunction> = z.union([
  LenSchema,
  CountWhereSchema,
  YearsBetweenSchema,
  MonthsBetweenSchema,
  TodaySchema,
  LowerSchema,
  UpperSchema,
  InstitutionRecognizedSchema,
]);

export const OperandSchema: z.ZodType<Operand> = z.union([
  RefSchema,
  SafeFunctionSchema,
  LiteralArraySchema,
  LiteralSchema,
]);

// ─── Predicate Node Schemas ──────────────────────────────────────

const AllSchema: z.ZodType<AllNode> = z.object({
  all: z.array(z.lazy(() => PredicateNodeSchema)).min(1).max(20),
});

const AnySchema: z.ZodType<AnyNode> = z.object({
  any: z.array(z.lazy(() => PredicateNodeSchema)).min(1).max(20),
});

const NotSchema: z.ZodType<NotNode> = z.object({
  not: z.lazy(() => PredicateNodeSchema),
});

// Comparison: each is an object with a single key and a 2-element tuple value
function comparisonSchema(op: string) {
  return z.object({
    [op]: z.tuple([
      z.lazy(() => OperandSchema),
      z.lazy(() => OperandSchema),
    ]),
  });
}

const EqSchema = comparisonSchema("eq");
const NeSchema = comparisonSchema("ne");
const GtSchema = comparisonSchema("gt");
const LtSchema = comparisonSchema("lt");
const GteSchema = comparisonSchema("gte");
const LteSchema = comparisonSchema("lte");

const InSetSchema = z.object({
  in: z.tuple([
    z.lazy(() => OperandSchema),
    z.lazy(() => OperandSchema),
  ]),
});

const NotInSetSchema = z.object({
  not_in: z.tuple([
    z.lazy(() => OperandSchema),
    z.lazy(() => OperandSchema),
  ]),
});

const ExistsSchema = z.object({
  exists: z.string().min(1),
});

const NotExistsSchema = z.object({
  not_exists: z.string().min(1),
});

const MatchesRegexSchema = z.object({
  matches_regex: z.tuple([
    z.lazy(() => OperandSchema),
    z.string(),
  ]),
});

const ContainsSchema = z.object({
  contains: z.tuple([
    z.lazy(() => OperandSchema),
    z.lazy(() => OperandSchema),
  ]),
});

export const PredicateNodeSchema: z.ZodType<PredicateNode> = z.union([
  AllSchema,
  AnySchema,
  NotSchema,
  EqSchema,
  NeSchema,
  GtSchema,
  LtSchema,
  GteSchema,
  LteSchema,
  InSetSchema,
  NotInSetSchema,
  ExistsSchema,
  NotExistsSchema,
  MatchesRegexSchema,
  ContainsSchema,
]) as z.ZodType<PredicateNode>;

// ─── Node type detection helpers ─────────────────────────────────

const LOGICAL_OPS = new Set(["all", "any", "not"]);
const COMPARISON_OPS = new Set(["eq", "ne", "gt", "lt", "gte", "lte"]);
const SET_OPS = new Set(["in", "not_in"]);
const EXISTENCE_OPS = new Set(["exists", "not_exists"]);
const STRING_OPS = new Set(["matches_regex", "contains"]);
const SAFE_FUNCTION_OPS = new Set([
  "len", "count_where", "years_between", "months_between",
  "today", "lower", "upper", "institution_recognized",
]);

export const ALL_NODE_TYPES = new Set([
  ...LOGICAL_OPS, ...COMPARISON_OPS, ...SET_OPS,
  ...EXISTENCE_OPS, ...STRING_OPS,
]);

export function getNodeType(node: unknown): string | null {
  if (typeof node !== "object" || node === null || Array.isArray(node)) {
    return null;
  }
  const keys = Object.keys(node);
  if (keys.length !== 1) return null;
  return ALL_NODE_TYPES.has(keys[0]) ? keys[0] : null;
}

export function isRef(value: unknown): value is Ref {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "ref" in value &&
    typeof (value as Ref).ref === "string"
  );
}

export function isSafeFunction(value: unknown): value is SafeFunction {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === 1 && SAFE_FUNCTION_OPS.has(keys[0]);
}

export function isLogicalOp(op: string): boolean {
  return LOGICAL_OPS.has(op);
}

export function isComparisonOp(op: string): boolean {
  return COMPARISON_OPS.has(op);
}

export function isSetOp(op: string): boolean {
  return SET_OPS.has(op);
}

export function isExistenceOp(op: string): boolean {
  return EXISTENCE_OPS.has(op);
}

export function isStringOp(op: string): boolean {
  return STRING_OPS.has(op);
}
