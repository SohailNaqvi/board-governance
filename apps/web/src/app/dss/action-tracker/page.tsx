/**
 * Board Action Tracker List Page — /dss/action-tracker
 *
 * Displays all board action items with filterable status and category.
 * Filter state is stored in URL query params (shareable, survives reload).
 */

"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { BoardActionItem } from "@prisma/client";
import StatusPill from "@/components/dss/status-pill";
import Tag from "@/components/dss/tag";
import KpiTile from "@/components/dss/kpi-tile";
import AlertBanner from "@/components/dss/alert-banner";

const BOARD_ACTION_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "AT_RISK",
  "OVERDUE",
  "COMPLETED",
  "CLOSED",
];

const BOARD_ACTION_CATEGORIES = [
  "GOVERNANCE",
  "STRATEGIC",
  "FINANCIAL",
  "ACADEMIC",
  "COMPLIANCE",
];

// Status to pill variant mapping
function getStatusPillVariant(
  status: string
): "on-track" | "at-risk" | "overdue" | "done" {
  switch (status) {
    case "COMPLETED":
    case "CLOSED":
      return "done";
    case "IN_PROGRESS":
    case "OPEN":
      return "at-risk";
    case "AT_RISK":
      return "at-risk";
    case "OVERDUE":
      return "overdue";
    default:
      return "at-risk";
  }
}

// ─── Filter Pill Component ───────────────────────────────────────

interface FilterPillProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function FilterPill({ label, selected, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: "4px",
        border: selected ? "1px solid var(--ink)" : "1px solid var(--muted)",
        backgroundColor: selected ? "var(--ink)" : "transparent",
        color: selected ? "white" : "var(--ink)",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500",
        transition: "all 0.15s ease",
      }}
      title={label}
    >
      {label}
    </button>
  );
}

// ─── Main List Component ────────────────────────────────────────

function ActionTrackerListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL params
  const selectedStatuses = useMemo(() => {
    const param = searchParams.get("statuses");
    return param ? param.split(",") : [];
  }, [searchParams]);

  const selectedCategories = useMemo(() => {
    const param = searchParams.get("categories");
    return param ? param.split(",") : [];
  }, [searchParams]);

  // Local state
  const [actions, setActions] = useState<BoardActionItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    overdue: 0,
    atRisk: 0,
    completedThisQuarter: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const fetchActions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (selectedStatuses.length > 0) {
        params.set("status", selectedStatuses.join(","));
      }

      if (selectedCategories.length > 0) {
        params.set("category", selectedCategories.join(","));
      }

      const response = await fetch(
        `/api/dss/board/actions?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setActions(data.actions);
      setStats(data.stats);
    } catch (err) {
      console.error("[action-tracker] Error fetching actions:", err);
      setError("Failed to load board actions");
    } finally {
      setLoading(false);
    }
  }, [selectedStatuses, selectedCategories]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  // Toggle filter
  const toggleFilter = (type: "status" | "category", value: string) => {
    const current =
      type === "status" ? selectedStatuses : selectedCategories;
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    const params = new URLSearchParams();
    if (type === "status" && updated.length > 0) {
      params.set("statuses", updated.join(","));
    }
    if (type === "category" && updated.length > 0) {
      params.set("categories", updated.join(","));
    }

    // Update other filter if it was active
    if (
      type === "status" &&
      selectedCategories.length > 0
    ) {
      params.set("categories", selectedCategories.join(","));
    }
    if (
      type === "category" &&
      selectedStatuses.length > 0
    ) {
      params.set("statuses", selectedStatuses.join(","));
    }

    router.push(`?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    router.push("?");
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div data-testid="action-tracker-list">
      {/* Page Head */}
      <h1
        style={{
          fontSize: "30px",
          fontFamily: "Fraunces, serif",
          margin: "0 0 8px 0",
        }}
      >
        Board Action Tracker
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "var(--muted)",
          fontStyle: "italic",
          margin: "0 0 24px 0",
        }}
      >
        Consolidated cross-committee action items with status monitoring and
        deadline alerts
      </p>

      {/* KPI Strip */}
      <div
        data-testid="action-kpi-strip"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <KpiTile
          label="Total Open"
          value={stats.total - stats.completedThisQuarter}
        />
        <KpiTile label="Overdue" value={stats.overdue} deltaType="down" />
        <KpiTile label="At Risk" value={stats.atRisk} deltaType="flag" />
        <KpiTile
          label="Completed (Q)"
          value={stats.completedThisQuarter}
          deltaType="up"
        />
      </div>

      {/* Alert Banner */}
      {stats.overdue > 0 && (
        <AlertBanner
          title={`${stats.overdue} action${stats.overdue !== 1 ? "s" : ""} overdue`}
          subtitle="Review with owners to get back on track"
          ctaLabel="View overdue"
        />
      )}

      {/* Status Filter Pill Strip */}
      <div
        style={{
          marginTop: "24px",
          marginBottom: "16px",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)" }}>
          Status:
        </span>
        {BOARD_ACTION_STATUSES.map((status) => (
          <FilterPill
            key={status}
            label={status}
            selected={selectedStatuses.includes(status)}
            onClick={() => toggleFilter("status", status)}
          />
        ))}
      </div>

      {/* Category Filter Pill Strip */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)" }}>
          Category:
        </span>
        {BOARD_ACTION_CATEGORIES.map((category) => (
          <FilterPill
            key={category}
            label={category}
            selected={selectedCategories.includes(category)}
            onClick={() => toggleFilter("category", category)}
          />
        ))}
      </div>

      {/* Clear Filters Button */}
      {(selectedStatuses.length > 0 || selectedCategories.length > 0) && (
        <button
          onClick={clearFilters}
          style={{
            padding: "6px 12px",
            borderRadius: "4px",
            border: "1px solid var(--muted)",
            backgroundColor: "transparent",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: "12px",
            marginBottom: "24px",
            transition: "all 0.15s ease",
          }}
        >
          Clear all filters
        </button>
      )}

      {/* Loading / Error States */}
      {loading && (
        <p style={{ textAlign: "center", color: "var(--muted)" }}>
          Loading board actions...
        </p>
      )}

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "4px",
            backgroundColor: "var(--rose-light, rgba(255, 85, 85, 0.1))",
            color: "var(--rose)",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && actions.length === 0 && (
        <div
          style={{
            padding: "32px 16px",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          <p>No board actions match your filters.</p>
          <button
            onClick={clearFilters}
            style={{
              marginTop: "8px",
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid var(--muted)",
              backgroundColor: "transparent",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Actions Table */}
      {!loading && !error && actions.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            marginTop: "16px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--muted)" }}>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: "600" }}>
                ID
              </th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: "600" }}>
                Description
              </th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: "600" }}>
                Owner
              </th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: "600" }}>
                Due Date
              </th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: "600" }}>
                Status
              </th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: "600" }}>
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => (
              <tr
                key={action.id}
                style={{
                  borderBottom: "1px solid var(--muted-light, #eee)",
                  transition: "background-color 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  (
                    e.currentTarget as HTMLTableRowElement
                  ).style.backgroundColor = "var(--muted-light, #f9f9f9)";
                }}
                onMouseLeave={(e) => {
                  (
                    e.currentTarget as HTMLTableRowElement
                  ).style.backgroundColor = "transparent";
                }}
              >
                <td style={{ padding: "8px" }}>
                  <Link
                    href={`/dss/action-tracker/${action.actionRef}`}
                    style={{
                      color: "var(--ink)",
                      textDecoration: "none",
                      fontWeight: "600",
                    }}
                  >
                    {action.actionRef}
                  </Link>
                </td>
                <td
                  style={{
                    padding: "8px",
                    maxWidth: "300px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={action.description}
                >
                  <Link
                    href={`/dss/action-tracker/${action.actionRef}`}
                    style={{
                      color: "var(--ink)",
                      textDecoration: "none",
                    }}
                  >
                    {action.description}
                  </Link>
                </td>
                <td style={{ padding: "8px" }}>
                  <Tag label={`${action.ownerName}/${action.ownerUnit}`} variant="teal" />
                </td>
                <td style={{ padding: "8px" }}>
                  {formatDate(action.dueDate)}
                </td>
                <td style={{ padding: "8px" }}>
                  <StatusPill
                    status={getStatusPillVariant(action.status)}
                    label={action.status}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "4px",
                        borderRadius: "2px",
                        backgroundColor: "var(--muted-light, #ddd)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${action.progressPercent}%`,
                          backgroundColor: "var(--sage)",
                          transition: "width 0.2s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                      {action.progressPercent}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Page Wrapper with Suspense ──────────────────────────────────

export default function ActionTrackerPage() {
  return (
    <Suspense fallback={<div>Loading action tracker...</div>}>
      <ActionTrackerListContent />
    </Suspense>
  );
}
