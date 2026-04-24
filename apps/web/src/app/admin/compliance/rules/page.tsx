/**
 * Rule List Page — /admin/compliance/rules
 *
 * Displays all compliance rules from the catalog API with filterable columns.
 * Filter state is stored in URL query params (shareable, survives reload).
 * Client-side pagination (brief decision: paginate, not virtualize).
 */

"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComplianceRuleRecord } from "@ums/compliance";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchRules } from "@/lib/compliance/api-client";
import {
  RuleListSkeleton,
  ErrorState,
  EmptyState,
} from "@/components/compliance/states";

// ─── Constants ───────────────────────────────────────────────────

const PAGE_SIZE = 25;

const SOURCES = ["HEC", "UNIVERSITY", "FACULTY", "PROGRAMME"] as const;
const SEVERITIES = ["BLOCKING", "WARNING", "INFORMATIONAL"] as const;
const STATUSES = ["DRAFT", "EFFECTIVE", "RETIRED"] as const;

// ─── Badge variants ──────────────────────────────────────────────

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

// ─── Multi-select filter chip ────────────────────────────────────

function FilterChips({
  label,
  options,
  selected,
  onChange,
  testId,
}: {
  label: string;
  options: readonly string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  testId: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid={testId}>
      <span className="text-xs font-medium text-muted-foreground">{label}:</span>
      {options.map((opt) => {
        const active = selected.has(opt);
        return (
          <button
            key={opt}
            onClick={() => {
              const next = new Set(selected);
              if (active) next.delete(opt);
              else next.add(opt);
              onChange(next);
            }}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            {opt.charAt(0) + opt.slice(1).toLowerCase()}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page export with Suspense boundary ──────────────────────────

export default function RulesListPage() {
  return (
    <Suspense fallback={<RuleListSkeleton />}>
      <RulesListContent />
    </Suspense>
  );
}

// ─── Inner component (uses useSearchParams) ──────────────────────

function RulesListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Read filter state from URL ──
  const searchQuery = searchParams.get("q") ?? "";
  const selectedSources = useMemo(
    () => new Set(searchParams.get("source")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );
  const selectedSeverities = useMemo(
    () =>
      new Set(searchParams.get("severity")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );
  const selectedStatuses = useMemo(
    () => new Set(searchParams.get("status")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );
  const currentPage = Number(searchParams.get("page") ?? "1");

  // ── Data state ──
  const [rules, setRules] = useState<ComplianceRuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch rules ──
  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRules();
      setRules(data.rules);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load rules"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // ── Update URL query params ──
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Reset to page 1 when filters change (unless page itself is being set)
      if (!("page" in updates)) {
        params.delete("page");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // ── Client-side filtering ──
  const filtered = useMemo(() => {
    let result = rules;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.ruleId.toLowerCase().includes(q) ||
          r.messageTemplate.toLowerCase().includes(q)
      );
    }

    if (selectedSources.size > 0) {
      result = result.filter((r) => selectedSources.has(r.source));
    }
    if (selectedSeverities.size > 0) {
      result = result.filter((r) => selectedSeverities.has(r.severity));
    }
    if (selectedStatuses.size > 0) {
      result = result.filter((r) => selectedStatuses.has(r.status));
    }

    return result;
  }, [rules, searchQuery, selectedSources, selectedSeverities, selectedStatuses]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // ── Parse case types from JSON string ──
  function parseCaseTypes(json: string): string[] {
    try {
      return JSON.parse(json) as string[];
    } catch {
      return [];
    }
  }

  // ── Render ──
  if (loading) return <RuleListSkeleton />;
  if (error) return <ErrorState message={error} onRetry={loadRules} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Compliance Rules</h1>

      {/* Filters */}
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <Input
          placeholder="Search by rule ID or title..."
          value={searchQuery}
          onChange={(e) => updateParams({ q: e.target.value || null })}
          className="max-w-sm"
          data-testid="rule-search"
        />

        <div className="flex flex-wrap gap-4">
          <FilterChips
            label="Source"
            options={SOURCES}
            selected={selectedSources}
            onChange={(s) =>
              updateParams({
                source: s.size > 0 ? [...s].join(",") : null,
              })
            }
            testId="filter-source"
          />
          <FilterChips
            label="Severity"
            options={SEVERITIES}
            selected={selectedSeverities}
            onChange={(s) =>
              updateParams({
                severity: s.size > 0 ? [...s].join(",") : null,
              })
            }
            testId="filter-severity"
          />
          <FilterChips
            label="Status"
            options={STATUSES}
            selected={selectedStatuses}
            onChange={(s) =>
              updateParams({
                status: s.size > 0 ? [...s].join(",") : null,
              })
            }
            testId="filter-status"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} rule{filtered.length !== 1 ? "s" : ""} found
        {filtered.length !== rules.length && ` (of ${rules.length} total)`}
      </p>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Rule ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[100px]">Source</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="w-[120px]">Case Type</TableHead>
                  <TableHead className="w-[50px] text-right">Ver</TableHead>
                  <TableHead className="w-[110px] text-right">
                    Updated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((rule) => (
                  <TableRow
                    key={rule.id}
                    className="cursor-pointer"
                    data-testid={`rule-row-${rule.ruleId}`}
                  >
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/admin/compliance/rules/${rule.id}`}
                        className="hover:underline"
                      >
                        {rule.ruleId}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm">
                      <Link href={`/admin/compliance/rules/${rule.id}`}>
                        {rule.messageTemplate}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(rule.severity)}>
                        {rule.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(rule.status)}>
                        {rule.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {parseCaseTypes(rule.appliesToCaseTypes).join(", ")}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      v{rule.version}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(rule.updatedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between"
              data-testid="pagination"
            >
              <p className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={safePage <= 1}
                  onClick={() =>
                    updateParams({ page: String(safePage - 1) })
                  }
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    updateParams({ page: String(safePage + 1) })
                  }
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
