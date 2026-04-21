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
  isRef,
  isSafeFunction,
  getNodeType,
} from "./grammar.js";
import { getAttributeCatalog, type AttributeEntry } from "./attribute-catalog.js";

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
    case "exists":
    case "not_exists": {
      const attrPath = (node as Record<string, string>)[nodeType]!;
      validateAttributePath(attrPath, `${path}.${nodeType}`, errors);
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
  func: Record<string, unknown>,
  path: string,
  errors: ValidationError[]
): void {
  const key = Object.keys(func)[0];

  switch (key) {
    case "len": {
      validateOperand(func.len as Operand, `${path}.len`, errors);
      break;
    }
    case "count_where": {
      const cw = func.count_where as { in: Operand; where: PredicateNode };
      validateOperand(cw.in, `${path}.count_where.in`, errors);
      // The where clause is a predicate node
      validateNode(cw.where, `${path}.count_where.where`, 0, DEFAULT_MAX_DEPTH, errors);
      break;
    }
    case "years_between":
    case "months_between": {
      const args = func[key] as [Operand, Operand];
      validateOperand(args[0], `${path}.${key}[0]`, errors);
      validateOperand(args[1], `${path}.${key}[1]`, errors);
      break;
    }
    case "today":
      // No operands
      break;
    case "lower":
    case "upper": {
      validateOperand(func[key] as Operand, `${path}.${key}`, errors);
      break;
    }
    case "institution_recognized": {
      const ir = func.institution_recognized as { name: Operand; country: Operand };
      validateOperand(ir.name, `${path}.institution_recognized.name`, errors);
      validateOperand(ir.country, `${path}.institution_recognized.country`, errors);
      break;
    }
    default:
      errors.push({ path, message: `Unknown safe function: "${key}"` });
  }
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
