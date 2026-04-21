/**
 * Predicate Evaluator
 *
 * Evaluates a parsed PredicateNode against a CaseContext to produce
 * a boolean result. Safe functions are evaluated inline.
 *
 * Design constraints:
 * - No side effects
 * - No async (context is pre-resolved before evaluation)
 * - Throws EvaluationError on runtime failures (missing refs, type mismatches)
 */

import type { PredicateNode, Operand } from "./grammar.js";
import { getNodeType, isRef, isSafeFunction } from "./grammar.js";
import type { CaseContext } from "./case-context.js";
import { resolveRef } from "./case-context.js";

export class EvaluationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

export interface EvaluationResult {
  outcome: boolean;
  /** Observed values collected during evaluation for evidence reporting */
  evidence: Record<string, unknown>;
}

/**
 * Evaluate a predicate expression against a case context.
 *
 * @param predicate A structurally valid PredicateNode (must pass validatePredicate first)
 * @param ctx The fully-resolved CaseContext
 * @returns EvaluationResult with outcome and evidence
 * @throws EvaluationError on runtime failures
 */
export function evaluatePredicate(
  predicate: PredicateNode,
  ctx: CaseContext
): EvaluationResult {
  const evidence: Record<string, unknown> = {};
  const outcome = evalNode(predicate, ctx, "$", evidence);
  return { outcome, evidence };
}

function evalNode(
  node: PredicateNode,
  ctx: CaseContext,
  path: string,
  evidence: Record<string, unknown>
): boolean {
  const nodeType = getNodeType(node);
  if (!nodeType) {
    throw new EvaluationError("Invalid node structure", path);
  }

  switch (nodeType) {
    case "all": {
      const children = (node as { all: PredicateNode[] }).all;
      return children.every((child, i) =>
        evalNode(child, ctx, `${path}.all[${i}]`, evidence)
      );
    }
    case "any": {
      const children = (node as { any: PredicateNode[] }).any;
      return children.some((child, i) =>
        evalNode(child, ctx, `${path}.any[${i}]`, evidence)
      );
    }
    case "not": {
      const child = (node as { not: PredicateNode }).not;
      return !evalNode(child, ctx, `${path}.not`, evidence);
    }

    case "eq":
    case "ne":
    case "gt":
    case "lt":
    case "gte":
    case "lte": {
      const [lhs, rhs] = (node as Record<string, [Operand, Operand]>)[nodeType]!;
      const left = resolveOperand(lhs, ctx, `${path}.${nodeType}[0]`, evidence);
      const right = resolveOperand(rhs, ctx, `${path}.${nodeType}[1]`, evidence);
      return compare(nodeType, left, right);
    }

    case "in": {
      const [lhs, rhs] = (node as { in: [Operand, Operand] }).in;
      const value = resolveOperand(lhs, ctx, `${path}.in[0]`, evidence);
      const list = resolveOperand(rhs, ctx, `${path}.in[1]`, evidence);
      if (!Array.isArray(list)) {
        throw new EvaluationError(`'in' requires array as second operand, got ${typeof list}`, `${path}.in[1]`);
      }
      return list.some((item) => looseEqual(value, item));
    }

    case "not_in": {
      const [lhs, rhs] = (node as { not_in: [Operand, Operand] }).not_in;
      const value = resolveOperand(lhs, ctx, `${path}.not_in[0]`, evidence);
      const list = resolveOperand(rhs, ctx, `${path}.not_in[1]`, evidence);
      if (!Array.isArray(list)) {
        throw new EvaluationError(`'not_in' requires array as second operand, got ${typeof list}`, `${path}.not_in[1]`);
      }
      return !list.some((item) => looseEqual(value, item));
    }

    case "exists": {
      const attrPath = (node as { exists: string }).exists;
      const value = resolveRef(ctx, attrPath);
      evidence[attrPath] = value;
      return value !== undefined && value !== null;
    }

    case "not_exists": {
      const attrPath = (node as { not_exists: string }).not_exists;
      const value = resolveRef(ctx, attrPath);
      evidence[attrPath] = value;
      return value === undefined || value === null;
    }

    case "matches_regex": {
      const [lhs, pattern] = (node as { matches_regex: [Operand, string] }).matches_regex;
      const value = resolveOperand(lhs, ctx, `${path}.matches_regex[0]`, evidence);
      if (typeof value !== "string") {
        throw new EvaluationError(
          `matches_regex requires string operand, got ${typeof value}`,
          `${path}.matches_regex[0]`
        );
      }
      return new RegExp(pattern).test(value);
    }

    case "contains": {
      const [lhs, rhs] = (node as { contains: [Operand, Operand] }).contains;
      const haystack = resolveOperand(lhs, ctx, `${path}.contains[0]`, evidence);
      const needle = resolveOperand(rhs, ctx, `${path}.contains[1]`, evidence);

      if (typeof haystack === "string" && typeof needle === "string") {
        return haystack.includes(needle);
      }
      if (Array.isArray(haystack)) {
        return haystack.some((item) => looseEqual(item, needle));
      }
      throw new EvaluationError(
        `contains requires string or array haystack, got ${typeof haystack}`,
        `${path}.contains[0]`
      );
    }

    default:
      throw new EvaluationError(`Unknown node type: ${nodeType}`, path);
  }
}

function resolveOperand(
  operand: Operand,
  ctx: CaseContext,
  path: string,
  evidence: Record<string, unknown>
): unknown {
  if (isRef(operand)) {
    const value = resolveRef(ctx, operand.ref);
    evidence[operand.ref] = value;
    return value;
  }

  if (isSafeFunction(operand)) {
    return evalSafeFunction(operand as Record<string, unknown>, ctx, path, evidence);
  }

  // Literal or literal array — return as-is
  return operand;
}

function evalSafeFunction(
  func: Record<string, unknown>,
  ctx: CaseContext,
  path: string,
  evidence: Record<string, unknown>
): unknown {
  const key = Object.keys(func)[0];

  switch (key) {
    case "len": {
      const inner = resolveOperand(func.len as Operand, ctx, `${path}.len`, evidence);
      if (Array.isArray(inner)) return inner.length;
      if (typeof inner === "string") return inner.length;
      throw new EvaluationError(`len requires array or string, got ${typeof inner}`, `${path}.len`);
    }

    case "count_where": {
      const cw = func.count_where as { in: Operand; where: PredicateNode };
      const collection = resolveOperand(cw.in, ctx, `${path}.count_where.in`, evidence);
      if (!Array.isArray(collection)) {
        throw new EvaluationError(`count_where requires array, got ${typeof collection}`, `${path}.count_where.in`);
      }

      let count = 0;
      for (let i = 0; i < collection.length; i++) {
        // Create a sub-context where "item" references the current element
        const itemCtx = createItemContext(ctx, collection[i]);
        if (evalNode(cw.where, itemCtx, `${path}.count_where.where[${i}]`, evidence)) {
          count++;
        }
      }
      return count;
    }

    case "years_between": {
      const [a, b] = func.years_between as [Operand, Operand];
      const dateA = toDate(resolveOperand(a, ctx, `${path}.years_between[0]`, evidence), `${path}.years_between[0]`);
      const dateB = toDate(resolveOperand(b, ctx, `${path}.years_between[1]`, evidence), `${path}.years_between[1]`);
      return yearsBetween(dateA, dateB);
    }

    case "months_between": {
      const [a, b] = func.months_between as [Operand, Operand];
      const dateA = toDate(resolveOperand(a, ctx, `${path}.months_between[0]`, evidence), `${path}.months_between[0]`);
      const dateB = toDate(resolveOperand(b, ctx, `${path}.months_between[1]`, evidence), `${path}.months_between[1]`);
      return monthsBetween(dateA, dateB);
    }

    case "today":
      return new Date();

    case "lower": {
      const val = resolveOperand(func.lower as Operand, ctx, `${path}.lower`, evidence);
      if (typeof val !== "string") {
        throw new EvaluationError(`lower requires string, got ${typeof val}`, `${path}.lower`);
      }
      return val.toLowerCase();
    }

    case "upper": {
      const val = resolveOperand(func.upper as Operand, ctx, `${path}.upper`, evidence);
      if (typeof val !== "string") {
        throw new EvaluationError(`upper requires string, got ${typeof val}`, `${path}.upper`);
      }
      return val.toUpperCase();
    }

    case "institution_recognized": {
      // This returns a boolean but needs async in production.
      // For the synchronous evaluator, we look up a pre-resolved flag
      // in the context or treat it as a computed value.
      // Convention: the CaseContext builder pre-resolves this into
      // computed.institutionRecognized if the rule uses it.
      const ir = func.institution_recognized as { name: Operand; country: Operand };
      const name = resolveOperand(ir.name, ctx, `${path}.institution_recognized.name`, evidence);
      const country = resolveOperand(ir.country, ctx, `${path}.institution_recognized.country`, evidence);
      evidence["institution_recognized.name"] = name;
      evidence["institution_recognized.country"] = country;

      // Check pre-resolved lookup in computed context
      const lookupKey = `institutionRecognized:${name}:${country}`;
      const preResolved = ctx.computed[lookupKey];
      if (preResolved !== undefined) return preResolved;

      // If not pre-resolved, we can't do async lookup here.
      // Return false with a warning in evidence.
      evidence["institution_recognized.warning"] = "Not pre-resolved; defaulting to false";
      return false;
    }

    default:
      throw new EvaluationError(`Unknown safe function: ${key}`, path);
  }
}

/**
 * Create a sub-context for count_where iteration.
 * The "item" prefix resolves to the current array element.
 */
function createItemContext(parent: CaseContext, item: unknown): CaseContext {
  return {
    ...parent,
    // We add "item" as a pseudo-prefix by placing it in computed
    // and overriding resolveRef behavior via a proxy-like approach.
    // Actually, the simplest approach: since resolveRef walks by prefix,
    // we extend the context with an "item" key.
    // TypeScript won't know about it, but resolveRef uses bracket access.
    ...(({ item } as unknown) as Partial<CaseContext>),
  } as CaseContext;
}

// ─── Comparison helpers ─────────────────────────────────────────

function compare(op: string, left: unknown, right: unknown): boolean {
  switch (op) {
    case "eq":
      return looseEqual(left, right);
    case "ne":
      return !looseEqual(left, right);
    case "gt":
      return toComparable(left) > toComparable(right);
    case "lt":
      return toComparable(left) < toComparable(right);
    case "gte":
      return toComparable(left) >= toComparable(right);
    case "lte":
      return toComparable(left) <= toComparable(right);
    default:
      return false;
  }
}

/**
 * Loose equality: handles string/number coercion for dates and numbers.
 */
function looseEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // String/number coercion
  if (typeof a === "number" && typeof b === "string") return a === Number(b);
  if (typeof a === "string" && typeof b === "number") return Number(a) === b;

  return false;
}

/**
 * Convert to a comparable primitive (number or string).
 * Dates become timestamps for ordering.
 */
function toComparable(value: unknown): number | string {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return isNaN(n) ? value : n;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "boolean") return value ? 1 : 0;
  return String(value);
}

/**
 * Coerce a value to a Date.
 */
function toDate(value: unknown, path: string): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      throw new EvaluationError(`Cannot parse date: "${value}"`, path);
    }
    return d;
  }
  if (typeof value === "number") return new Date(value);
  throw new EvaluationError(`Expected date, got ${typeof value}`, path);
}

function yearsBetween(a: Date, b: Date): number {
  const diffMs = Math.abs(b.getTime() - a.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
}

function monthsBetween(a: Date, b: Date): number {
  const early = a < b ? a : b;
  const late = a < b ? b : a;
  return (
    (late.getFullYear() - early.getFullYear()) * 12 +
    (late.getMonth() - early.getMonth())
  );
}
