/**
 * Rule Detail Page — /admin/compliance/rules/[id]
 *
 * Shows a single rule in full: header fields, description, predicate
 * pseudocode, raw JSON toggle, and version history.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ComplianceRuleRecord, PredicateNode } from "@ums/compliance";
import { Badge } from "@/components/ui/badge";
import { PredicateRenderer } from "@/components/compliance/predicate-renderer";
import {
  RuleDetailSkeleton,
  ErrorState,
} from "@/components/compliance/states";
import { fetchRule, fetchRuleVersions, ComplianceApiError } from "@/lib/compliance/api-client";

// ─── Helper: parse stored JSON strings ───────────────────────────

function parseJsonArray(json: string): string[] {
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

function parsePredicate(json: string): PredicateNode | null {
  try {
    return JSON.parse(json) as PredicateNode;
  } catch {
    return null;
  }
}

// ─── Badge helpers (same logic as list page) ─────────────────────

function severityVariant(
  severity: string
): "destructive" | "default" | "secondary" | "outline" {
  switch (severity) {
    case "BLOCKING":
      return "destructive";
    case "WARNING":
      return "default";
    case "INFORMATIONAL":
      return "secondary";
    default:
      return "outline";
  }
}

function statusVariant(
  status: string
): "default" | "secondary" | "outline" {
  switch (status) {
    case "EFFECTIVE":
      return "default";
    case "DRAFT":
      return "secondary";
    case "RETIRED":
      return "outline";
    default:
      return "outline";
  }
}

// ─── Detail field ────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

// ─── Not Found state ─────────────────────────────────────────────

function NotFound({ id }: { id: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center"
      data-testid="rule-not-found"
    >
      <p className="text-lg font-medium">Rule not found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        No rule with ID &quot;{id}&quot; exists.
      </p>
      <Link
        href="/admin/compliance/rules"
        className="mt-4 text-sm underline underline-offset-4 hover:no-underline"
      >
        Back to rules
      </Link>
    </div>
  );
}

// ─── Page component ──────────────────────────────────────────────

export default function RuleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [rule, setRule] = useState<ComplianceRuleRecord | null>(null);
  const [versions, setVersions] = useState<ComplianceRuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const loadRule = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const ruleData = await fetchRule(id);
      setRule(ruleData);

      // Fetch versions using the stable ruleId
      try {
        const versionData = await fetchRuleVersions(ruleData.ruleId);
        setVersions(versionData.versions);
      } catch {
        // Version fetch failure is non-critical; show rule without versions
        setVersions([]);
      }
    } catch (err) {
      if (err instanceof ComplianceApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load rule"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRule();
  }, [loadRule]);

  if (loading) return <RuleDetailSkeleton />;
  if (error) return <ErrorState message={error} onRetry={loadRule} />;
  if (notFound) return <NotFound id={id} />;
  if (!rule) return null;

  const predicate = parsePredicate(rule.evaluation);
  const caseTypes = parseJsonArray(rule.appliesToCaseTypes);
  const programmeTypes = rule.appliesToProgrammeTypes
    ? parseJsonArray(rule.appliesToProgrammeTypes)
    : [];

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/admin/compliance/rules"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        data-testid="back-to-list"
      >
        &larr; Back to rules
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="rule-title">
            {rule.ruleId}
          </h1>
          <Badge variant={statusVariant(rule.status)}>{rule.status}</Badge>
          <Badge variant={severityVariant(rule.severity)}>
            {rule.severity}
          </Badge>
        </div>
      </div>

      {/* Metadata grid */}
      <dl
        className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border bg-card p-5 sm:grid-cols-4"
        data-testid="rule-metadata"
      >
        <Field label="Database ID">
          <span className="font-mono text-xs">{rule.id}</span>
        </Field>
        <Field label="Rule ID">
          <span className="font-mono text-xs">{rule.ruleId}</span>
        </Field>
        <Field label="Source">
          <Badge variant="outline">{rule.source}</Badge>
        </Field>
        <Field label="Version">
          <span className="text-sm">v{rule.version}</span>
        </Field>
        <Field label="Case Types">
          <span className="text-sm">{caseTypes.join(", ") || "—"}</span>
        </Field>
        {programmeTypes.length > 0 && (
          <Field label="Programme Types">
            <span className="text-sm">{programmeTypes.join(", ")}</span>
          </Field>
        )}
        <Field label="Created">
          <span className="text-sm">
            {new Date(rule.createdAt).toLocaleString()}
          </span>
        </Field>
        <Field label="Last Updated">
          <span className="text-sm">
            {new Date(rule.updatedAt).toLocaleString()}
          </span>
        </Field>
        {rule.lastEditedBy && (
          <Field label="Last Edited By">
            <span className="text-sm">{rule.lastEditedBy}</span>
          </Field>
        )}
        {rule.sourceReference && (
          <Field label="Source Reference">
            <span className="text-sm">{rule.sourceReference}</span>
          </Field>
        )}
        {rule.effectiveFrom && (
          <Field label="Effective From">
            <span className="text-sm">
              {new Date(rule.effectiveFrom).toLocaleDateString()}
            </span>
          </Field>
        )}
        {rule.effectiveTo && (
          <Field label="Effective To">
            <span className="text-sm">
              {new Date(rule.effectiveTo).toLocaleDateString()}
            </span>
          </Field>
        )}
      </dl>

      {/* Message template / description */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Message Template
        </h2>
        <p className="rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
          {rule.messageTemplate}
        </p>
      </section>

      {/* Predicate rendering */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Predicate
          </h2>
          <button
            onClick={() => setShowRawJson((v) => !v)}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:no-underline"
            data-testid="toggle-raw-json"
          >
            {showRawJson ? "Show pseudocode" : "Show raw predicate"}
          </button>
        </div>

        {showRawJson ? (
          <pre
            className="overflow-x-auto rounded-md border bg-muted/30 p-4 text-xs"
            data-testid="predicate-raw-json"
          >
            {JSON.stringify(predicate, null, 2)}
          </pre>
        ) : predicate ? (
          <PredicateRenderer predicate={predicate} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Unable to parse predicate expression.
          </p>
        )}
      </section>

      {/* Version history */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Version History
        </h2>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No version history available.
          </p>
        ) : (
          <div className="rounded-lg border" data-testid="version-history">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Version</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Updated</th>
                  <th className="px-4 py-2 text-left font-medium">Edited By</th>
                </tr>
              </thead>
              <tbody>
                {versions
                  .sort((a, b) => b.version - a.version)
                  .map((v) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        <Link
                          href={`/admin/compliance/rules/${v.id}`}
                          className="font-mono text-xs hover:underline"
                        >
                          v{v.version}
                          {v.id === rule.id && (
                            <span className="ml-1 text-muted-foreground">
                              (current)
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={statusVariant(v.status)}>
                          {v.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(v.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {v.lastEditedBy ?? "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
