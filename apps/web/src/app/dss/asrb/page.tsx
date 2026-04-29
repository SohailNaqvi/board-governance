/**
 * ASRB Cases List Page — /dss/asrb
 *
 * Displays all ASRB cases with filterable status, type, urgency, feeder body.
 * Filter state is stored in URL query params (shareable, survives reload).
 */

"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ASRBCase, FeederClient } from "@prisma/client";
import StatusPill from "@/components/dss/status-pill";
import Tag from "@/components/dss/tag";

// ─── Constants ───────────────────────────────────────────────────

const CASE_STATUSES = [
  "RECEIVED",
  "COMPLIANCE_EVALUATED",
  "VETTING",
  "READY_FOR_AGENDA",
  "ON_AGENDA",
  "DECIDED",
  "CLOSED",
  "RETURNED",
  "HELD",
  "WITHDRAWN",
  "URGENT_CIRCULATION",
  "DEFERRED",
];

const CASE_TYPES = [
  "SYNOPSIS_APPROVAL",
  "GEC_CONSTITUTION",
  "EXAMINER_APPOINTMENT",
  "RESULT_APPROVAL",
  "SUPERVISOR_CHANGE",
  "TOPIC_CHANGE",
  "EXTENSION_CANDIDATURE",
  "LEAVE_ABSENCE",
  "RESEARCH_PROJECT_APPROVAL",
  "COMPREHENSIVE_RESULT",
  "COURSEWORK_WAIVER",
  "OTHER",
];

const URGENCIES = ["NORMAL", "URGENT_CIRCULATION"];
const FEEDER_BODY_TYPES = ["DGSC", "FACULTY_BOARD"];

// ─── Status mapping to pill variant ──────────────────────────────

function getStatusPillVariant(
  status: string
): "on-track" | "at-risk" | "overdue" | "done" {
  switch (status) {
    case "READY_FOR_AGENDA":
    case "ON_AGENDA":
    case "DECIDED":
      return "on-track";
    case "RECEIVED":
    case "COMPLIANCE_EVALUATED":
    case "VETTING":
    case "HELD":
    case "DEFERRED":
      return "at-risk";
    case "URGENT_CIRCULATION":
    case "RETURNED":
      return "overdue";
    case "CLOSED":
    case "WITHDRAWN":
      return "done";
    default:
      return "at-risk";
  }
}

// ─── Multi-select filter pill ────────────────────────────────────

function FilterPills({
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
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)" }}>
        {label}:
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }} data-testid={testId}>
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
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: active ? "600" : "500",
                borderRadius: "4px",
                border: active ? "1px solid var(--amber)" : "1px solid var(--line)",
                backgroundColor: active ? "var(--amber-bg)" : "transparent",
                color: active ? "var(--amber)" : "var(--muted)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {opt.charAt(0) + opt.slice(1).toLowerCase().replace(/_/g, " ")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page export with Suspense boundary ──────────────────────────

export default function AsrbPage() {
  return (
    <Suspense fallback={<AsrbLoadingSkeleton />}>
      <AsrbContent />
    </Suspense>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────

function AsrbLoadingSkeleton() {
  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ fontSize: "30px", fontFamily: "Fraunces, serif", margin: "0 0 8px 0" }}>
        ASRB Cases
      </h1>
      <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 40px 0" }}>
        Loading...
      </p>
      <div
        style={{
          height: "400px",
          backgroundColor: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: "6px",
          animation: "pulse 2s infinite",
        }}
      />
    </div>
  );
}

// ─── Inner component (uses useSearchParams) ──────────────────────

function AsrbContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Read filter state from URL ──
  const searchQuery = searchParams.get("q") ?? "";
  const selectedStatuses = useMemo(
    () => new Set(searchParams.get("status")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );
  const selectedCaseTypes = useMemo(
    () => new Set(searchParams.get("caseType")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );
  const selectedUrgencies = useMemo(
    () => new Set(searchParams.get("urgency")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );
  const selectedFeederBodyTypes = useMemo(
    () => new Set(searchParams.get("feederBodyType")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );

  // ── Data state ──
  const [cases, setCases] = useState<(ASRBCase & { feederClient: FeederClient })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch cases ──
  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatuses.size > 0) params.set("status", [...selectedStatuses].join(","));
      if (selectedCaseTypes.size > 0) params.set("caseType", [...selectedCaseTypes].join(","));
      if (selectedUrgencies.size > 0) params.set("urgency", [...selectedUrgencies].join(","));
      if (selectedFeederBodyTypes.size > 0) params.set("feederBodyType", [...selectedFeederBodyTypes].join(","));
      if (searchQuery) params.set("q", searchQuery);

      const qs = params.toString();
      const res = await fetch(`/api/dss/asrb/cases${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to load cases");
      const data = await res.json();
      setCases(data.cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, [selectedStatuses, selectedCaseTypes, selectedUrgencies, selectedFeederBodyTypes, searchQuery]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

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
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // ── Parse case payload to extract title ──
  function getCaseTitle(casePayload: string, caseType: string): string {
    try {
      const payload = JSON.parse(casePayload);
      return payload.thesis_title || payload.title || `${caseType} Case`;
    } catch {
      return `${caseType} Case`;
    }
  }

  // ── Render ──
  if (error) {
    return (
      <div style={{ padding: "40px" }}>
        <h1 style={{ fontSize: "30px", fontFamily: "Fraunces, serif", margin: "0 0 8px 0" }}>
          ASRB Cases
        </h1>
        <div
          style={{
            marginTop: "32px",
            padding: "16px 20px",
            backgroundColor: "var(--rose-bg)",
            border: "1px solid var(--rose)",
            borderRadius: "6px",
            color: "var(--rose)",
            fontSize: "13px",
          }}
        >
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      {/* Page header */}
      <h1 style={{ fontSize: "30px", fontFamily: "Fraunces, serif", margin: "0 0 8px 0" }}>
        ASRB Cases
      </h1>
      <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 32px 0", fontStyle: "italic" }}>
        Academic Staff Review Board case tracking and evaluation
      </p>

      {/* Filters */}
      <div
        style={{
          backgroundColor: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: "6px",
          padding: "20px",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Search input */}
        <div>
          <input
            placeholder="Search by receipt reference or student number..."
            value={searchQuery}
            onChange={(e) => updateParams({ q: e.target.value || null })}
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "8px 12px",
              fontSize: "13px",
              border: "1px solid var(--line)",
              borderRadius: "4px",
              backgroundColor: "var(--bg)",
              color: "var(--ink)",
              fontFamily: "inherit",
            }}
            data-testid="case-search"
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <FilterPills
            label="Status"
            options={CASE_STATUSES}
            selected={selectedStatuses}
            onChange={(s) =>
              updateParams({
                status: s.size > 0 ? [...s].join(",") : null,
              })
            }
            testId="filter-status"
          />
          <FilterPills
            label="Case Type"
            options={CASE_TYPES}
            selected={selectedCaseTypes}
            onChange={(s) =>
              updateParams({
                caseType: s.size > 0 ? [...s].join(",") : null,
              })
            }
            testId="filter-caseType"
          />
          <FilterPills
            label="Urgency"
            options={URGENCIES}
            selected={selectedUrgencies}
            onChange={(s) =>
              updateParams({
                urgency: s.size > 0 ? [...s].join(",") : null,
              })
            }
            testId="filter-urgency"
          />
          <FilterPills
            label="Feeder Body"
            options={FEEDER_BODY_TYPES}
            selected={selectedFeederBodyTypes}
            onChange={(s) =>
              updateParams({
                feederBodyType: s.size > 0 ? [...s].join(",") : null,
              })
            }
            testId="filter-feederBodyType"
          />
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px" }}>
        {cases.length} case{cases.length !== 1 ? "s" : ""} found
      </p>

      {/* Table or empty state */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          Loading cases...
        </div>
      ) : cases.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: "6px",
            color: "var(--muted)",
          }}
        >
          <p style={{ margin: 0, fontSize: "13px" }}>No cases found matching your filters.</p>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "var(--panel)",
            }}
            data-testid="cases-table"
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--line)",
                  backgroundColor: "var(--bg)",
                }}
              >
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--muted)",
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Receipt Ref
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--muted)",
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Title
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--muted)",
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Student
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--muted)",
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Programme
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--muted)",
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--muted)",
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Urgency
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--muted)",
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Feeder
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--muted)",
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Received
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem) => (
                <tr
                  key={caseItem.id}
                  style={{
                    borderBottom: "1px solid var(--line)",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                      "var(--bg)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                      "transparent";
                  }}
                  data-testid={`case-row-${caseItem.id}`}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "12px",
                      color: "var(--ink)",
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    <Link
                      href={`/dss/asrb/${caseItem.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {caseItem.receiptReference}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "12px",
                      color: "var(--ink)",
                      maxWidth: "300px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Link
                      href={`/dss/asrb/${caseItem.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {getCaseTitle(caseItem.casePayload, caseItem.caseType)}
                    </Link>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--muted)" }}>
                    {caseItem.studentRegNo || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--muted)" }}>
                    {caseItem.programmeCode || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusPill
                      status={getStatusPillVariant(caseItem.status)}
                      label={caseItem.status.replace(/_/g, " ")}
                    />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {caseItem.urgency === "URGENT_CIRCULATION" ? (
                      <Tag label="URGENT" variant="amber" />
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--muted)" }}>
                    {caseItem.feederClient.displayName}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", color: "var(--muted)" }}>
                    {new Date(caseItem.receivedAt).toLocaleDateString()}
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
