import Link from "next/link";
import type { BoardActionItem } from "@prisma/client";
import { getAction, listActions } from "@/lib/board/actions";
import StatusPill from "@/components/dss/status-pill";
import Tag from "@/components/dss/tag";
import Card from "@/components/dss/card";

interface PageProps {
  params: { actionId: string };
}

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

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ActionDetailPage({ params }: PageProps) {
  const { actionId } = params;

  // Fetch the action item
  const action = await getAction(actionId);

  // 404 if not found
  if (!action) {
    return (
      <div data-testid="action-not-found">
        <h1
          style={{
            fontSize: "30px",
            fontFamily: "Fraunces, serif",
            margin: "0 0 16px 0",
          }}
        >
          Action Not Found
        </h1>
        <p style={{ color: "var(--muted)" }}>
          The board action item "{actionId}" does not exist.
        </p>
        <Link
          href="/dss/action-tracker"
          style={{
            color: "var(--ink)",
            textDecoration: "underline",
            fontSize: "14px",
            display: "inline-block",
            marginTop: "16px",
          }}
        >
          ← Back to Action Tracker
        </Link>
      </div>
    );
  }

  // Fetch related actions from same source meeting
  const relatedActions = await listActions({
    search: "",
  });

  const related = relatedActions.filter(
    (a) =>
      a.sourceMeeting === action.sourceMeeting &&
      a.actionRef !== action.actionRef
  );

  return (
    <div data-testid="action-detail">
      {/* Back Link */}
      <Link
        href="/dss/action-tracker"
        style={{
          color: "var(--ink)",
          textDecoration: "none",
          fontSize: "13px",
          display: "inline-block",
          marginBottom: "24px",
        }}
      >
        ← Back to Action Tracker
      </Link>

      {/* Page Head */}
      <h1
        style={{
          fontSize: "30px",
          fontFamily: "Fraunces, serif",
          margin: "0 0 8px 0",
        }}
      >
        {action.actionRef}
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "var(--muted)",
          fontStyle: "italic",
          margin: "0 0 24px 0",
        }}
      >
        {action.description}
      </p>

      {/* Card 1: Overview */}
      <Card>
        <h2
          style={{
            fontSize: "16px",
            fontFamily: "Fraunces, serif",
            margin: "0 0 16px 0",
          }}
        >
          Action Overview
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            fontSize: "13px",
          }}
        >
          {/* Left column */}
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--muted)",
                  marginBottom: "4px",
                }}
              >
                Category
              </label>
              <Tag label={action.category} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--muted)",
                  marginBottom: "4px",
                }}
              >
                Owner
              </label>
              <p style={{ margin: "0" }}>
                {action.ownerName} <span style={{ color: "var(--muted)" }}>/ {action.ownerUnit}</span>
              </p>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--muted)",
                  marginBottom: "4px",
                }}
              >
                Source Meeting
              </label>
              <p style={{ margin: "0" }}>{action.sourceMeeting}</p>
            </div>
          </div>

          {/* Right column */}
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--muted)",
                  marginBottom: "4px",
                }}
              >
                Status
              </label>
              <StatusPill
                status={getStatusPillVariant(action.status)}
                label={action.status}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--muted)",
                  marginBottom: "4px",
                }}
              >
                Due Date
              </label>
              <p style={{ margin: "0" }}>{formatDate(action.dueDate)}</p>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--muted)",
                  marginBottom: "4px",
                }}
              >
                Progress
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    flex: 1,
                    height: "6px",
                    borderRadius: "3px",
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
                <span style={{ fontSize: "12px", fontWeight: "600", minWidth: "40px" }}>
                  {action.progressPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Card 2: Timeline */}
      <Card>
        <h2
          style={{
            fontSize: "16px",
            fontFamily: "Fraunces, serif",
            margin: "0 0 16px 0",
          }}
        >
          Timeline
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
            fontSize: "13px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--muted)",
                marginBottom: "4px",
              }}
            >
              Created
            </label>
            <p style={{ margin: "0" }}>{formatDate(action.createdAt)}</p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--muted)",
                marginBottom: "4px",
              }}
            >
              Last Updated
            </label>
            <p style={{ margin: "0" }}>{formatDate(action.updatedAt)}</p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--muted)",
                marginBottom: "4px",
              }}
            >
              Due
            </label>
            <p style={{ margin: "0" }}>{formatDate(action.dueDate)}</p>
          </div>
        </div>

        <p
          style={{
            marginTop: "16px",
            fontSize: "12px",
            color: "var(--muted)",
            fontStyle: "italic",
          }}
        >
          Future versions will include detailed progress notes and milestone tracking.
        </p>
      </Card>

      {/* Card 3: Related Actions (only if there are any) */}
      {related.length > 0 && (
        <Card>
          <h2
            style={{
              fontSize: "16px",
              fontFamily: "Fraunces, serif",
              margin: "0 0 16px 0",
            }}
          >
            Related Actions from "{action.sourceMeeting}"
          </h2>

          <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
            {related.map((r) => (
              <li
                key={r.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid var(--muted-light, #eee)",
                }}
              >
                <Link
                  href={`/dss/action-tracker/${r.actionRef}`}
                  style={{
                    color: "var(--ink)",
                    textDecoration: "none",
                    fontSize: "13px",
                  }}
                >
                  <strong>{r.actionRef}</strong> — {r.description}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
