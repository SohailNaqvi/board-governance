"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import KpiTile from "@/components/dss/kpi-tile";
import StatusPill from "@/components/dss/status-pill";

// ─── Types ──────────────────────────────────────────────────

interface Decision {
  id: string;
  decisionRef: string;
  title: string;
  summary: string;
  sourceBodyType: string;
  sourceMeeting: string;
  decidedAt: string;
  category: string;
  status: string;
  proposer: string;
  caseRef: string | null;
}

interface Stats {
  total: number;
  approvedThisQuarter: number;
  deferred: number;
  rejected: number;
}

// ─── Constants ──────────────────────────────────────────────

const SOURCE_BODIES = ["BOARD_OF_GOVERNORS", "SYNDICATE", "ACADEMIC_COUNCIL", "ASRB"] as const;
const STATUSES = ["APPROVED", "CONDITIONALLY_APPROVED", "DEFERRED", "REJECTED", "RATIFIED", "RESCINDED"] as const;
const CATEGORIES = ["STRATEGIC", "ACADEMIC", "FINANCIAL", "HR", "RESEARCH", "COMPLIANCE", "STUDENT_AFFAIRS", "OPERATIONS"] as const;

const BODY_ABBR: Record<string, string> = {
  BOARD_OF_GOVERNORS: "BoG",
  SYNDICATE: "SYN",
  ACADEMIC_COUNCIL: "AC",
  ASRB: "ASRB",
};

function getStatusPillStatus(status: string): "on-track" | "at-risk" | "overdue" | "done" {
  switch (status) {
    case "APPROVED":
    case "RATIFIED":
      return "on-track";
    case "CONDITIONALLY_APPROVED":
    case "DEFERRED":
      return "at-risk";
    case "REJECTED":
    case "RESCINDED":
      return "overdue";
    default:
      return "at-risk";
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Filter pill ────────────────────────────────────────────

function FilterPills({
  label,
  options,
  selected,
  onChange,
  displayFn,
}: {
  label: string;
  options: readonly string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  displayFn?: (v: string) => string;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}:
      </span>
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
            style={{
              border: "1px solid",
              borderColor: active ? "var(--ink)" : "var(--line)",
              background: active ? "var(--ink)" : "var(--panel)",
              color: active ? "var(--panel)" : "var(--muted)",
              padding: "3px 10px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {displayFn ? displayFn(opt) : opt.charAt(0) + opt.slice(1).toLowerCase().replace(/_/g, " ")}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page wrapper ───────────────────────────────────────────

export default function DecisionRegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "var(--muted)" }}>Loading...</div>}>
      <DecisionRegisterContent />
    </Suspense>
  );
}

// ─── Content ────────────────────────────────────────────────

function DecisionRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedBodies = useMemo(
    () => new Set(searchParams.get("sourceBody")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );
  const selectedStatuses = useMemo(
    () => new Set(searchParams.get("status")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );
  const selectedCategories = useMemo(
    () => new Set(searchParams.get("category")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );
  const searchQuery = searchParams.get("q") ?? "";

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBodies.size > 0) params.set("sourceBodyType", [...selectedBodies].join(","));
      if (selectedStatuses.size > 0) params.set("status", [...selectedStatuses].join(","));
      if (selectedCategories.size > 0) params.set("category", [...selectedCategories].join(","));
      if (searchQuery) params.set("q", searchQuery);

      const qs = params.toString();
      const [decRes, statsRes] = await Promise.all([
        fetch(`/api/dss/decisions${qs ? `?${qs}` : ""}`),
        fetch("/api/dss/decisions/stats"),
      ]);

      if (decRes.ok) {
        const data = await decRes.json();
        setDecisions(Array.isArray(data) ? data : data.decisions ?? []);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [selectedBodies, selectedStatuses, selectedCategories, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div data-testid="decision-register-list">
      {/* Page head */}
      <div style={{ marginBottom: "24px", paddingBottom: "18px", borderBottom: "1px solid var(--line)" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "30px", fontWeight: 500, margin: 0 }}>
          Decision Register
        </h1>
        <p style={{ marginTop: "6px", fontSize: "13px", color: "var(--muted)", fontStyle: "italic" }}>
          Formal decisions across all governance bodies — Board, Syndicate, Academic Council, ASRB
        </p>
      </div>

      {/* KPI tiles */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "4px", padding: "16px" }}>
          <KpiTile label="Total Decisions" value={stats.total} />
          <KpiTile label="Approved This Quarter" value={stats.approvedThisQuarter} deltaType="up" />
          <KpiTile label="Deferred" value={stats.deferred} deltaType="flag" />
          <KpiTile label="Rejected" value={stats.rejected} deltaType="down" />
        </div>
      )}

      {/* Filters */}
      <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "4px", padding: "16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <FilterPills
          label="Source"
          options={SOURCE_BODIES}
          selected={selectedBodies}
          onChange={(s) => updateParams({ sourceBody: s.size > 0 ? [...s].join(",") : null })}
          displayFn={(v) => BODY_ABBR[v] ?? v}
        />
        <FilterPills label="Status" options={STATUSES} selected={selectedStatuses}
          onChange={(s) => updateParams({ status: s.size > 0 ? [...s].join(",") : null })} />
        <FilterPills label="Category" options={CATEGORIES} selected={selectedCategories}
          onChange={(s) => updateParams({ category: s.size > 0 ? [...s].join(",") : null })} />
        <input
          type="text"
          placeholder="Search title or summary..."
          value={searchQuery}
          onChange={(e) => updateParams({ q: e.target.value || null })}
          style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "13px", fontFamily: "inherit", background: "var(--bg)", maxWidth: "320px" }}
          data-testid="decision-search"
        />
      </div>

      {/* Count */}
      <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "12px" }}>
        {decisions.length} decision{decisions.length !== 1 ? "s" : ""} found
      </p>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>Loading...</div>
      ) : decisions.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", border: "1px dashed var(--line)", borderRadius: "4px" }}>
          No decisions match the current filters.
        </div>
      ) : (
        <div style={{ border: "1px solid var(--line)", borderRadius: "4px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--panel)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                {["Ref", "Title", "Source", "Decided", "Status", "Category"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid var(--line)", cursor: "pointer" }}>
                  <td style={{ padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px" }}>
                    <Link href={`/dss/decision-register/${d.decisionRef}`} style={{ color: "var(--ink)", textDecoration: "none" }}>
                      {d.decisionRef}
                    </Link>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "13px", maxWidth: "300px" }}>
                    <Link href={`/dss/decision-register/${d.decisionRef}`} style={{ color: "var(--ink)", textDecoration: "none" }}>
                      {d.title.length > 80 ? d.title.slice(0, 80) + "..." : d.title}
                    </Link>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ display: "inline-block", background: "#F0EDE6", color: "var(--ink)", padding: "3px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>
                      {BODY_ABBR[d.sourceBodyType] ?? d.sourceBodyType}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "12px", color: "var(--muted)" }}>
                    {formatDate(d.decidedAt)}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <StatusPill status={getStatusPillStatus(d.status)} label={d.status.replace(/_/g, " ")} />
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "12px", color: "var(--muted)" }}>
                    {d.category.replace(/_/g, " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
