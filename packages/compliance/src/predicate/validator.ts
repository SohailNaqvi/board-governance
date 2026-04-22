/**
 * Predicate Validator
 *
 * Validates a predicate expression for:
 * - Syntactic correctness (via Zod parse)
 * - Known attribute paths (via the attribute-path catalog)
 * - Correct operator arity
 * - Nesting depth limit (configurable, default 6)
 * - Regex compilability (RE2-safe subset)
 */

import {
  PredicateNodeSchema,
  type PredicateNode,
  type Operand,
  type SafeFunction,
  type ExistsNode,
  type NotExistsNode,
  type LenFunction,
  type CountWhereFunction,
  type YearsBetweenFunction,
  type MonthsBetweenFunction,
  type LowerFunction,
  type UpperFunction,
  type InstitutionRecognizedFunction,
  isRef,
  isSafeFunction,
  getNodeType,
} from "./grammar"
import { getAttributeCatalog, type AttributeEntry } from "./attribute-catalog"

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidatorOptions {
  maxDepth?: number; // Default 6
}

const DEFAULT_MAX_DEPTH = 6;

/**
 * Validate a predicate expression.
 *
 * 1. Zod structural parse
 * 2. Depth check
 * 3. Attribute path resolution
 * 4. Regex compilability
 */
export function validatePredicate(
  predicate: unknown,
  options: ValidatorOptions = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;

  // Step 1: Structural parse
  const parseResult = PredicateNodeSchema.safeParse(predicate);
  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      errors.push({
        path: issue.path.join("."),
        message: issue.message,
      });
    }
    return { valid: false, errors };
  }

  const node = parseResult.data;

  // Step 2-4: Deep validation
  validateNode(node, "$", 0, maxDepth, errors);

  return { valid: errors.length === 0, errors };
}

function validateNode(
  node: PredicateNode,
  path: string,
  depth: number,
  maxDepth: number,
  errors: ValidationError[]
): void {
  // Depth check
  if (depth > maxDepth) {
    errors.push({
      path,
      message: `Nesting depth ${depth} exceeds maximum ${maxDepth}`,
    });
    return;
  }

  const nodeType = getNodeType(node);
  if (!nodeType) {
    errors.push({ path, message: "Invalid node: must have exactly one recognized key" });
    return;
  }

  switch (nodeType) {
    case "all":
    case "any": {
      const children = (node as { all?: PredicateNode[]; any?: PredicateNode[] })[nodeType]!;
      for (let i = 0; i < children.length; i++) {
        validateNode(children[i], `${path}.${nodeType}[${i}]`, depth + 1, maxDepth, errors);
      }
      break;
    }
    case "not": {
      const child = (node as { not: PredicateNode }).not;
      validateNode(child, `${path}.not`, depth + 1, maxDepth, errors);
      break;
    }
    case "eq":
    case "ne":
    case "gt":
    case "lt":
    case "gte":
    case "lte": {
      const operands = (node as Record<string, [Operand, Operand]>)[nodeType]!;
      validateOperand(operands[0], `${path}.${nodeType}[0]`, errors);
      validateOperand(operands[1], `${path}.${nodeType}[1]`, errors);
      break;
    }
    case "in":
    case "not_in": {
      const operands = (node as Record<string, [Operand, Operand]>)[nodeType]!;
      validateOperand(operands[0], `${path}.${nodeType}[0]`, errors);
      validateOperand(operands[1], `${path}.${nodeType}[1]`, errors);
      break;
    }
    case "exists": {
      const attrPath = (node as ExistsNode).exists;
      validateAttributePath(attrPath, `${path}.exists`, errors);
      break;
    }
    case "not_exists": {
      const attrPath = (node as NotExistsNode).not_exists;
      validateAttributePath(attrPath, `${path}.not_exists`, errors);
      break;
    }
    case "matches_regex": {
      const args = (node as { matches_regex: [Operand, string] }).matches_regex;
      validateOperand(args[0], `${path}.matches_regex[0]`, errors);
      validateRegex(args[1], `${path}.matches_regex[1]`, errors);
      break;
    }
    case "contains": {
      const args = (node as { contains: [Operand, Operand] }).contains;
      validateOperand(args[0], `${path}.contains[0]`, errors);
      validateOperand(args[1], `${path}.contains[1]`, errors);
      break;
    }
  }
}

function validateOperand(
  operand: Operand,
  path: string,
  errors: ValidationError[]
): void {
  if (isRef(operand)) {
    validateAttributePath(operand.ref, path, errors);
  } else if (isSafeFunction(operand)) {
    validateSafeFunction(operand, path, errors);
  }
  // Literals and literal arrays are always valid after Zod parse
}

function validateAttributePath(
  attrPath: string,
  path: string,
  errors: ValidationError[]
): void {
  const catalog = getAttributeCatalog();

  // Handle dynamic paths like "programme.ruleParameters.plagiarismThreshold"
  // These resolve to programme.ruleParameters.* which is a map lookup
  if (attrPath.startsWith("programme.ruleParameters.")) {
    // ruleParameters is a map; any sub-key is valid
    const basePath = "programme.ruleParameters";
    if (!catalog.has(basePath)) {
      errors.push({
        path,
        message: `Unknown attribute path: "${basePath}" (programme.ruleParameters map not in catalog)`,
      });
    }
    return;
  }

  // Handle "item." prefix inside count_where contexts — these are relative
  // and validated within the count_where array element context
  if (attrPath.startsWith("item.")) {
    // item.* paths are relative references inside count_where; valid by convention
    return;
  }

  if (!catalog.has(attrPath)) {
    errors.push({
      path,
      message: `Unknown attribute path: "${attrPath}"`,
    });
  }
}

function validateSafeFunction(
  func: SafeFunction,
  path: string,
  errors: ValidationError[]
): void {
  if ("len" in func) {
    const f = func as LenFunction;
    validateOperand(f.len, `${path}.len`, errors);
    return;
  }
  if ("count_where" in func) {
    const f = func as CountWhereFunction;
    validateOperand(f.count_where.in, `${path}.count_where.in`, errors);
    validateNode(f.count_where.where, `${path}.count_where.where`, 0, DEFAULT_MAX_DEPTH, errors);
    return;
  }
  if ("years_between" in func) {
    const f = func as YearsBetweenFunction;
    validateOperand(f.years_between[0], `${path}.years_between[0]`, errors);
    validateOperand(f.years_between[1], `${path}.years_between[1]`, errors);
    return;
  }
  if ("months_between" in func) {
    const f = func as MonthsBetweenFunction;
    validateOperand(f.months_between[0], `${path}.months_between[0]`, errors);
    validateOperand(f.months_between[1], `${path}.months_between[1]`, errors);
    return;
  }
  if ("today" in func) {
    // No operands to validate
    return;
  }
  if ("lower" in func) {
    const f = func as LowerFunction;
    validateOperand(f.lower, `${path}.lower`, errors);
    return;
  }
  if ("upper" in func) {
    const f = func as UpperFunction;
    validateOperand(f.upper, `${path}.upper`, errors);
    return;
  }
  if ("institution_recognized" in func) {
    const f = func as InstitutionRecognizedFunction;
    validateOperand(f.institution_recognized.name, `${path}.institution_recognized.name`, errors);
    validateOperand(f.institution_recognized.country, `${path}.institution_recognized.country`, errors);
    return;
  }
  // Exhaustiveness guard
  const _exhaustive: never = func;
  errors.push({ path, message: `Unknown safe function` });
}

function validateRegex(
  pattern: string,
  path: string,
  errors: ValidationError[]
): void {
  try {
    // Use JavaScript RegExp as a proxy for RE2 compatibility.
    // In production, we'd use a RE2 binding. For now, JS RegExp catches
    // most syntax errors. Patterns that use JS-only features (backreferences,
    // lookahead) should be caught by a RE2 linter in a future iteration.
    new RegExp(pattern);
  } catch {
    errors.push({
      path,
      message: `Invalid regex pattern: "${pattern}"`,
    });
  }
}
