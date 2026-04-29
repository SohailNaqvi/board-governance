/**
 * ASRB Case Detail Page — /dss/asrb/[caseId]
 *
 * Displays full details of an ASRB case including overview, compliance evaluations,
 * audit trail, and attachments.
 */

import Link from "next/link";
import { getCase } from "@/lib/asrb/cases";
import Card from "@/components/dss/card";
import { StatusPill } from "@/components/dss/status-pill";
import { Tag } from "@/components/dss/tag";

interface CaseDetailPageProps {
  params: { caseId: string };
}

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

function getCaseTitle(casePayload: string, caseType: string): string {
  try {
    const payload = JSON.parse(casePayload);
    return payload.thesis_title || payload.title || `${caseType} Case`;
  } catch {
    return `${caseType} Case`;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const caseData = await getCase(params.caseId);

  if (!caseData) {
    return (
      <div
        style={{
          padding: "40px",
        }}
        data-testid="case-not-found"
      >
        <div
          style={{
            backgroundColor: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: "6px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--ink)", margin: "0 0 8px 0" }}>
            Case Not Found
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 20px 0" }}>
            The case you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/dss/asrb"
            style={{
              display: "inline-block",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: "600",
              backgroundColor: "var(--amber-bg)",
              color: "var(--amber)",
              borderRadius: "4px",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Back to ASRB Cases
          </Link>
        </div>
      </div>
    );
  }

  const parsedPayload = (() => {
    try {
      return JSON.parse(caseData.casePayload);
    } catch {
      return {};
    }
  })();

  const caseTitle = getCaseTitle(caseData.casePayload, caseData.caseType);

  return (
    <div style={{ padding: "40px" }} data-testid="case-detail">
      {/* Back link */}
      <Link
        href="/dss/asrb"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
          color: "var(--amber)",
          textDecoration: "none",
          marginBottom: "24px",
          cursor: "pointer",
        }}
      >
        ← Back to ASRB Cases
      </Link>

      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <p
          style={{
            fontSize: "11px",
            fontFamily: "IBM Plex Mono, monospace",
            color: "var(--muted)",
            margin: "0 0 8px 0",
          }}
        >
          {caseData.receiptReference}
        </p>
        <h1 style={{ fontSize: "28px", fontFamily: "Fraunces, serif", margin: "0 0 12px 0" }}>
          {caseTitle}
        </h1>

        {/* Status, urgency, and date on right */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <StatusPill status={getStatusPillVariant(caseData.status)} label={caseData.status.replace(/_/g, " ")} />
          {caseData.urgency === "URGENT_CIRCULATION" && <Tag label="URGENT" variant="amber" />}
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            {new Date(caseData.receivedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px",
        }}
      >
        {/* Case Overview Card */}
        <Card title="Case Overview">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Case Type */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                  Case Type
                </p>
                <p style={{ fontSize: "12px", color: "var(--ink)", margin: 0 }}>
                  {caseData.caseType}
                </p>
              </div>

              {/* Status */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                  Status
                </p>
                <StatusPill status={getStatusPillVariant(caseData.status)} label={caseData.status.replace(/_/g, " ")} />
              </div>

              {/* Urgency */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                  Urgency
                </p>
                <p style={{ fontSize: "12px", color: "var(--ink)", margin: 0 }}>
                  {caseData.urgency}
                </p>
              </div>

              {/* Feeder Info */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                  Feeder Body
                </p>
                <p style={{ fontSize: "12px", color: "var(--ink)", margin: 0 }}>
                  {caseData.feederClient.displayName} ({caseData.feederBodyCode})
                </p>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Student Reg No */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                  Student Reg No
                </p>
                <p style={{ fontSize: "12px", color: "var(--ink)", margin: 0 }}>
                  {caseData.studentRegNo || "—"}
                </p>
              </div>

              {/* Programme Code */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                  Programme
                </p>
                <p style={{ fontSize: "12px", color: "var(--ink)", margin: 0 }}>
                  {caseData.programmeCode || "—"}
                </p>
              </div>

              {/* Supervisor Emp ID */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                  Supervisor Emp ID
                </p>
                <p style={{ fontSize: "12px", color: "var(--ink)", margin: 0 }}>
                  {caseData.supervisorEmpId || "—"}
                </p>
              </div>

              {/* Resolution */}
              {caseData.feederResolutionNum && (
                <div>
                  <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                    Resolution
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--ink)", margin: 0 }}>
                    {caseData.feederResolutionBody} #{caseData.feederResolutionNum}
                    {caseData.feederResolutionDate && (
                      <span> — {new Date(caseData.feederResolutionDate).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Parsed payload fields */}
          {Object.keys(parsedPayload).length > 0 && (
            <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 12px 0" }}>
                Additional Payload Data
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {Object.entries(parsedPayload)
                  .filter(([key]) => !key.startsWith("_"))
                  .map(([key, value]) => (
                    <div key={key}>
                      <p style={{ fontSize: "10px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 2px 0" }}>
                        {key.replace(/_/g, " ")}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--ink)", margin: 0, wordBreak: "break-word" }}>
                        {typeof value === "string" ? value : JSON.stringify(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>

        {/* Compliance Evaluations Card */}
        <Card title="Compliance Evaluations">
          {caseData.complianceEvaluations.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {caseData.complianceEvaluations.map((eval_) => (
                <div
                  key={eval_.id}
                  style={{
                    padding: "12px",
                    backgroundColor: "var(--bg)",
                    borderRadius: "4px",
                    borderLeft: "3px solid var(--amber)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink)", textTransform: "uppercase" }}>
                      {eval_.status}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                      {new Date(eval_.evaluatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {eval_.summary && (
                    <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                      {typeof eval_.summary === "string" ? eval_.summary : JSON.stringify(eval_.summary)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
              No compliance evaluations on record yet.
            </p>
          )}
        </Card>

        {/* Audit Trail Card */}
        <Card title="Audit Trail">
          {caseData.auditEvents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {caseData.auditEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: "12px",
                    backgroundColor: "var(--bg)",
                    borderRadius: "4px",
                    borderLeft: "3px solid var(--teal)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink)", textTransform: "uppercase" }}>
                      {event.eventType}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                      {new Date(event.occurredAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0 0 0" }}>
                    By: {event.actorId}
                  </p>
                  {event.details && (
                    <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0 0 0" }}>
                      {typeof event.details === "string" ? event.details : JSON.stringify(event.details)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
              No audit events recorded.
            </p>
          )}
        </Card>

        {/* Attachments Card */}
        <Card title="Attachments">
          {caseData.attachments.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {caseData.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  style={{
                    padding: "12px",
                    backgroundColor: "var(--bg)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "12px", fontWeight: "500", color: "var(--ink)", margin: "0 0 4px 0" }}>
                      {attachment.filename}
                    </p>
                    <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--muted)" }}>
                      <span>{attachment.docType}</span>
                      <span>{formatBytes(attachment.sizeBytes)}</span>
                      <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
                      {!attachment.uploaded && (
                        <span style={{ color: "var(--rose)" }}>Not uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
              No attachments.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
