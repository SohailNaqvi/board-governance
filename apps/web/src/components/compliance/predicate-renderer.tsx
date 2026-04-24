/**
 * PredicateRenderer — renders a predicate tree as indented pseudocode.
 *
 * Design decision (locked): rendered as readable pseudocode with node-type
 * labels, NOT as a JSON tree. Raw JSON is behind a separate disclosure.
 */

"use client";

import {
  getNodeType,
  isRef,
  isSafeFunction,
  type PredicateNode,
  type Operand,
  type SafeFunction,
} from "@ums/compliance";

// ─── Operand formatting ──────────────────────────────────────────

function formatOperand(op: Operand): string {
  if (op === null) return "null";
  if (typeof op === "string") return `"${op}"`;
  if (typeof op === "number" || typeof op === "boolean") return String(op);
  if (Array.isArray(op)) return `[${op.map(formatOperand).join(", ")}]`;
  if (isRef(op)) return op.ref;
  if (isSafeFunction(op)) return formatFunction(op);
  return JSON.stringify(op);
}

function formatFunction(fn: SafeFunction): string {
  if ("len" in fn) return `len(${formatOperand(fn.len)})`;
  if ("count_where" in fn)
    return `count_where(in: ${formatOperand(fn.count_where.in)}, where: ...)`;
  if ("years_between" in fn) {
    const [a, b] = fn.years_between;
    return `years_between(${formatOperand(a)}, ${formatOperand(b)})`;
  }
  if ("months_between" in fn) {
    const [a, b] = fn.months_between;
    return `months_between(${formatOperand(a)}, ${formatOperand(b)})`;
  }
  if ("today" in fn) return "today()";
  if ("lower" in fn) return `lower(${formatOperand(fn.lower)})`;
  if ("upper" in fn) return `upper(${formatOperand(fn.upper)})`;
  if ("institution_recognized" in fn) {
    const ir = fn.institution_recognized;
    return `institution_recognized(name: ${formatOperand(ir.name)}, country: ${formatOperand(ir.country)})`;
  }
  // Exhaustiveness guard
  const _exhaustive: never = fn;
  return String(_exhaustive);
}

// ─── Node rendering ──────────────────────────────────────────────

const OP_LABELS: Record<string, string> = {
  eq: "=",
  ne: "!=",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
  in: "IN",
  not_in: "NOT IN",
  contains: "CONTAINS",
  matches_regex: "MATCHES",
};

function NodeRenderer({
  node,
  depth = 0,
}: {
  node: PredicateNode;
  depth?: number;
}) {
  const nodeType = getNodeType(node);
  if (!nodeType) {
    return (
      <div style={{ paddingLeft: depth * 20 }} className="text-destructive">
        Unknown node: {JSON.stringify(node)}
      </div>
    );
  }

  const record = node as Record<string, unknown>;

  // Logical: all, any, not
  if (nodeType === "all" || nodeType === "any") {
    const children = record[nodeType] as PredicateNode[];
    return (
      <div style={{ paddingLeft: depth * 20 }}>
        <span className="font-semibold text-primary">
          {nodeType === "all" ? "ALL of:" : "ANY of:"}
        </span>
        {children.map((child, i) => (
          <NodeRenderer key={i} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  if (nodeType === "not") {
    const child = record.not as PredicateNode;
    return (
      <div style={{ paddingLeft: depth * 20 }}>
        <span className="font-semibold text-primary">NOT:</span>
        <NodeRenderer node={child} depth={depth + 1} />
      </div>
    );
  }

  // Existence: exists, not_exists
  if (nodeType === "exists" || nodeType === "not_exists") {
    const path = record[nodeType] as string;
    return (
      <div style={{ paddingLeft: depth * 20 }} className="font-mono text-sm">
        <span className="text-muted-foreground">
          {nodeType === "exists" ? "EXISTS" : "NOT EXISTS"}
        </span>{" "}
        {path}
      </div>
    );
  }

  // Comparison, set, and string ops: binary [left, right]
  const label = OP_LABELS[nodeType] ?? nodeType.toUpperCase();
  const operands = record[nodeType];

  if (Array.isArray(operands) && operands.length === 2) {
    const [left, right] = operands as [Operand, Operand];
    return (
      <div style={{ paddingLeft: depth * 20 }} className="font-mono text-sm">
        {formatOperand(left)}{" "}
        <span className="text-muted-foreground">{label}</span>{" "}
        {formatOperand(right)}
      </div>
    );
  }

  // Fallback
  return (
    <div style={{ paddingLeft: depth * 20 }} className="font-mono text-sm">
      {nodeType}: {JSON.stringify(operands)}
    </div>
  );
}

// ─── Public component ────────────────────────────────────────────

export function PredicateRenderer({
  predicate,
}: {
  predicate: PredicateNode;
}) {
  return (
    <div
      className="rounded-md border bg-muted/30 p-4 text-sm leading-relaxed"
      data-testid="predicate-pseudocode"
    >
      <NodeRenderer node={predicate} />
    </div>
  );
}
