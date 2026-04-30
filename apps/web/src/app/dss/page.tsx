'use client';

import Link from 'next/link';
import KpiTile from '@/components/dss/kpi-tile';
import AlertBanner from '@/components/dss/alert-banner';
import Card from '@/components/dss/card';
import Tag from '@/components/dss/tag';
import AgendaRow from '@/components/dss/agenda-row';
import ActionRow from '@/components/dss/action-row';
import PipelineRow from '@/components/dss/pipeline-row';
import AiNote from '@/components/dss/ai-note';

export default function StrategicCockpitPage() {
  return (
    <div data-testid="strategic-cockpit">
      {/* Demo-data banner */}
      <div
        data-testid="demo-data-banner"
        style={{
          backgroundColor: 'var(--amber-bg)',
          color: 'var(--amber)',
          padding: '12px 16px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          fontFamily: "'IBM Plex Sans', sans-serif",
          marginBottom: '24px',
          textAlign: 'center',
        }}
      >
        Demo data — content on this page is illustrative. Live data integration in subsequent slices.
      </div>

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '30px',
              fontFamily: "'Fraunces', serif",
              fontWeight: '700',
              color: 'var(--ink)',
              margin: '0 0 4px 0',
            }}
          >
            Strategic Cockpit
          </h1>
          <p
            style={{
              fontSize: '13px',
              fontStyle: 'italic',
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            Institutional posture · live synthesis across twenty-one source systems
          </p>
        </div>
        <div
          style={{
            fontSize: '11px',
            fontFamily: "'IBM Plex Mono', monospace",
            color: 'var(--muted)',
            textAlign: 'right',
          }}
        >
          Last sync: <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>04:12 ago</span> · Next in
          15:48
        </div>
      </div>

      {/* KPI strip */}
      <div
        data-testid="kpi-strip"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          marginBottom: '32px',
          padding: '20px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
        }}
      >
        <KpiTile
          label="Enrolment · Fall"
          value="4,782"
          delta={3.1}
          deltaType="down"
          isMock
        />
        <KpiTile
          label="At-risk students"
          value="187"
          delta={42}
          deltaType="flag"
          isMock
        />
        <KpiTile
          label="Research pipeline"
          value="PKR 412M"
          delta={11.4}
          deltaType="up"
          isMock
        />
        <KpiTile
          label="Faculty load index"
          value="1.08"
          delta={3}
          deltaType="flag"
          isMock
        />
        <KpiTile
          label="Fee collection"
          value="86.4%"
          delta={2.3}
          deltaType="down"
          isMock
        />
      </div>

      {/* Alert banner */}
      <div style={{ marginBottom: '32px' }}>
        <AlertBanner
          title="Syndicate meeting in 6 days · agenda ready for review"
          subtitle="AI-assembled from 14 pending items, 9 carry-overs, and 3 regulatory triggers · estimated duration 2h 40m"
          ctaLabel="Open draft agenda →"
          onCta={() => {
            // Handle CTA
          }}
        />
      </div>

      {/* Two-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: '20px',
        }}
      >
        {/* Left column: Syndicate Draft Agenda */}
        <Card
          title="Syndicate · Draft Agenda"
          subtitle="Meeting 142 · Thursday 07 May 2026, 10:00 AM · Vice-Chancellor's Conference Room"
          tag={<Tag label="AI-assembled" variant="teal" />}
          aiNote={
            <AiNote>
              Agenda assembled from pending-item ledger, regulatory triggers (HEC GEP-2023, PSG-2023),
              and carry-overs. Duration estimated from historical committee data. Sequence optimised to
              cover statutory items before lunch.
            </AiNote>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <AgendaRow
              number="01"
              body="Confirmation of Minutes of Meeting 141 (19 March 2026)"
              meta="Routine · 2 min"
              action="Approve"
            />
            <AgendaRow
              number="02"
              body="Action-Taken Report on decisions from Meeting 141"
              meta="9 items · 6 closed · 2 on-track · 1 overdue"
              aiBadge={true}
              action="Review"
            />
            <AgendaRow
              number="03"
              body="Fall 2026 Enrolment Shortfall · mitigation options"
              meta="Strategic · 20 min"
              aiBadge={true}
              action="Decide"
            />
            <AgendaRow
              number="04"
              body="ASRB recommendations · promotions to Associate Professor (7 cases)"
              meta="From ASRB meeting of 22 April · 15 min"
              action="Ratify"
            />
            <AgendaRow
              number="05"
              body="Proposed MS in AI & Computational Biology · HEC curriculum approval"
              meta="Statutory · 25 min · GEP-2023 compliant"
              action="Approve"
            />
            <AgendaRow
              number="06"
              body="Faculty workload redistribution · three departments above 1.15 threshold"
              meta="Operational · 12 min"
              aiBadge={true}
              action="Direct"
            />
            <AgendaRow
              number="07"
              body="Q3 Research Grants Report and ORIC utilisation"
              meta="Reporting · 10 min"
              action="Note"
            />
            <AgendaRow
              number="08"
              body="Any Other Business · Registrar's discretion"
              meta="Standing · 10 min"
              action="—"
            />
          </div>
        </Card>

        {/* Right column: stacked cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Action Follow-Up card */}
          <Card
            title="Action Follow-Up"
            subtitle="From Syndicate Meeting 141 · 19 March 2026"
            tag={<Tag label="9 open" variant="amber" />}
            aiNote={
              <AiNote>
                Status inferred from linked emails, committee minutes, and budget-release records. Items
                surfaced on agenda item 02.
              </AiNote>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <ActionRow
                description="Commission external review of the MS Data Science programme"
                owner="Owner: Dean, SSE · Due: 15 May"
                status="at-risk"
                due="T-21d"
              />
              <ActionRow
                description="Finalise MOU with TMC for enterprise systems consulting engagement"
                owner="Owner: Registrar · Due: 30 April"
                status="on-track"
                due="T-6d"
              />
              <ActionRow
                description="Submit revised PC-1 for the Semiconductor Design Centre to HEC"
                owner="Owner: Dean, Research · Due: 10 April"
                status="overdue"
                due="T+14d"
              />
              <ActionRow
                description="Circulate governance structure update for QEC & ORIC alignment"
                owner="Owner: Director QEC · Due: 25 April"
                status="done"
                due="—"
              />
              <ActionRow
                description="Negotiate faculty exchange agreement with ITU Lahore"
                owner="Owner: Dean, Humanities · Due: 20 May"
                status="on-track"
                due="T-26d"
              />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', textAlign: 'right' }}>
              <Link
                href="/dss/action-tracker"
                data-testid="action-followup-link"
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--amber)',
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                }}
              >
                View all →
              </Link>
            </div>
          </Card>

          {/* ASRB Readiness Pipeline card */}
          <Card
            title="ASRB · Readiness Pipeline"
            subtitle="Next meeting · 05 May 2026 · 11 cases under consideration"
            tag={<Tag label="7 ready" variant="sage" />}
            aiNote={
              <AiNote>
                Readiness score combines publications, citation impact, teaching scores, service
                contribution, and peer-review artefacts. Weights per HEC PSG-2023.
              </AiNote>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <PipelineRow name="Dr. F. Ahmed" department="Assoc. Prof. · Electrical Engg." score={92} />
              <PipelineRow name="Dr. M. Rashid" department="Assoc. Prof. · Physics" score={88} />
              <PipelineRow name="Dr. S. Bhatti" department="Assoc. Prof. · Computer Science" score={81} />
              <PipelineRow name="Dr. A. Khan" department="Professor · Chemistry" score={64} />
              <PipelineRow name="Dr. N. Hussain" department="Assoc. Prof. · Economics" score={58} />
              <PipelineRow name="Dr. R. Malik" department="Professor · Biology" score={41} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
