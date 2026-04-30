import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "@/components/dss/card";
import StatusPill from "@/components/dss/status-pill";
import { getDecision } from "@/lib/decisions";
import type { GovernanceBodyType, DecisionStatus } from "@prisma/client";

interface DecisionDetailPageProps {
  params: { decisionRef: string };
}

const BODY_NAMES: Record<string, string> = {
  BOARD_OF_GOVERNORS: "Board of Governors",
  SYNDICATE: "Syndicate",
  ACADEMIC_COUNCIL: "Academic Council",
  ASRB: "ASRB",
};

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      <div style={{ fontSize: "13px" }}>{children}</div>
    </div>
  );
}

export default async function DecisionDetailPage({ params }: DecisionDetailPageProps) {
  const decision = await getDecision(params.decisionRef);

  if (!decision) {
    return (
      <div style={{ textAlign: "center", padding: "64px 0" }} data-testid="decision-not-found">
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", marginBottom: "8px" }}>
          Decision not found
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "16px" }}>
          No decision with reference &quot;{params.decisionRef}&quot; exists.
        </p>
        <Link href="/dss/decision-register" style={{ color: "var(--amber)", textDecoration: "none" }}>
          ← Back to Decision Register
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="decision-detail">
      {/* Back link */}
      <Link
        href="/dss/decision-register"
        style={{ color: "var(--muted)", textDecoration: "none", fontSize: "13px", display: "inline-block", marginBottom: "20px" }}
      >
        ← Back to Decision Register
      </Link>

      {/* Header */}
      <div style={{ marginBottom: "24px", paddingBottom: "18px", borderBottom: "1px solid var(--line)" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "26px", fontWeight: 500, margin: "0 0 10px 0" }}>
          {decision.title}
        </h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "var(--muted)" }}>
            {decision.decisionRef}
          </span>
          <span style={{ display: "inline-block", background: "#F0EDE6", color: "var(--ink)", padding: "3px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>
            {BODY_ABBR[decision.sourceBodyType] ?? decision.sourceBodyType}
          </span>
          <StatusPill status={getStatusPillStatus(decision.status)} label={decision.status.replace(/_/g, " ")} />
        </div>
      </div>

      {/* Overview card */}
      <Card title="Decision Overview">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <Field label="Source Body">{BODY_NAMES[decision.sourceBodyType] ?? decision.sourceBodyType}</Field>
          <Field label="Source Meeting">{decision.sourceMeeting}</Field>
          <Field label="Decided">{new Date(decision.decidedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</Field>
          <Field label="Category">{decision.category.replace(/_/g, " ")}</Field>
          <Field label="Proposer">{decision.proposer}</Field>
          {decision.caseRef && <Field label="Case Ref">{decision.caseRef}</Field>}
        </div>
        <Field label="Summary">
          <p style={{ margin: 0, lineHeight: 1.6 }}>{decision.summary}</p>
        </Field>
      </Card>

      <div style={{ marginTop: "20px" }}>
        <Card title="Source Body Context">
          <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "var(--muted)" }}>
            This decision was made by {BODY_NAMES[decision.sourceBodyType] ?? decision.sourceBodyType} at <strong>{decision.sourceMeeting}</strong>. Detailed meeting context will appear here in a future slice when the meeting model is built.
          </p>
        </Card>
      </div>

      <div style={{ marginTop: "20px" }}>
        <Card title="Related">
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            Related decisions from the same meeting and linked action items will appear here in a future slice.
          </p>
        </Card>
      </div>
    </div>
  );
}
