import Link from 'next/link';
import { notFound } from 'next/navigation';
import Card from '@/components/card';
import StatusPill from '@/components/status-pill';
import { getDecision } from '@/lib/decisions';
import { GovernanceBodyType, DecisionStatus } from '@prisma/client';

interface DecisionDetailPageProps {
  params: {
    decisionRef: string;
  };
}

function getSourceBodyName(bodyType: GovernanceBodyType): string {
  const map: Record<GovernanceBodyType, string> = {
    BOARD_OF_GOVERNORS: 'Board of Governors',
    SYNDICATE: 'Syndicate',
    ACADEMIC_COUNCIL: 'Academic Council',
    ASRB: 'ASRB',
  };
  return map[bodyType];
}

function getStatusPillVariant(status: DecisionStatus): 'sage' | 'amber' | 'rose' {
  const statusMap: Record<DecisionStatus, 'sage' | 'amber' | 'rose'> = {
    APPROVED: 'sage',
    RATIFIED: 'sage',
    CONDITIONALLY_APPROVED: 'amber',
    DEFERRED: 'amber',
    REJECTED: 'rose',
    RESCINDED: 'rose',
  };
  return statusMap[status];
}

function getSourceBodyAbbr(bodyType: GovernanceBodyType): string {
  const map: Record<GovernanceBodyType, string> = {
    BOARD_OF_GOVERNORS: 'BoG',
    SYNDICATE: 'SYN',
    ACADEMIC_COUNCIL: 'AC',
    ASRB: 'ASRB',
  };
  return map[bodyType];
}

export default async function DecisionDetailPage({ params }: DecisionDetailPageProps) {
  const decision = await getDecision(params.decisionRef);

  if (!decision) {
    notFound();
  }

  return (
    <div style={{ padding: '40px' }} data-testid="decision-detail">
      <Link
        href="/dss/decision-register"
        style={{
          color: 'var(--link)',
          textDecoration: 'none',
          fontSize: '14px',
          marginBottom: '24px',
          display: 'inline-block',
        }}
      >
        ← Back to Decision Register
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Fraunces', fontSize: '30px', margin: '0 0 16px 0' }}>
          {decision.title}
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-block',
              backgroundColor: '#F0EDE6',
              color: 'var(--ink)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {getSourceBodyAbbr(decision.sourceBodyType)}
          </div>
          <StatusPill
            label={decision.status.replace(/_/g, ' ')}
            variant={getStatusPillVariant(decision.status)}
          />
        </div>
      </div>

      {/* Decision Overview Card */}
      <Card style={{ marginBottom: '24px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
          Decision Overview
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>
              Decision Ref
            </label>
            <p style={{ margin: 0, fontSize: '14px' }}>{decision.decisionRef}</p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>
              Decided Date
            </label>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {new Date(decision.decidedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>
              Source Body
            </label>
            <p style={{ margin: 0, fontSize: '14px' }}>{getSourceBodyName(decision.sourceBodyType)}</p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>
              Source Meeting
            </label>
            <p style={{ margin: 0, fontSize: '14px' }}>{decision.sourceMeeting}</p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>
              Category
            </label>
            <p style={{ margin: 0, fontSize: '14px' }}>{decision.category.replace(/_/g, ' ')}</p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>
              Status
            </label>
            <p style={{ margin: 0, fontSize: '14px' }}>{decision.status.replace(/_/g, ' ')}</p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>
              Proposer
            </label>
            <p style={{ margin: 0, fontSize: '14px' }}>{decision.proposer}</p>
          </div>

          {decision.caseRef && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>
                Case Ref
              </label>
              <p style={{ margin: 0, fontSize: '14px' }}>{decision.caseRef}</p>
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: '8px' }}>
            Summary
          </label>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{decision.summary}</p>
        </div>
      </Card>

      {/* Source Body Context Card */}
      <Card style={{ marginBottom: '24px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
          Source Body Context
        </h2>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--slate)' }}>
          This decision was made by {getSourceBodyName(decision.sourceBodyType)} at{' '}
          <strong>{decision.sourceMeeting}</strong>. Detailed meeting context will appear here in a
          future slice when the meeting model is built.
        </p>
      </Card>

      {/* Related Decisions Card */}
      <Card style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
          Related
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--slate)' }}>
          No other decisions from this meeting.
        </p>
      </Card>
    </div>
  );
}
