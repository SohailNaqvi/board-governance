'use client';

import { Suspense, useSearchParams } from 'react';
import Link from 'next/link';
import KpiTile from '@/components/kpi-tile';
import StatusPill from '@/components/status-pill';
import Tag from '@/components/tag';
import Card from '@/components/card';
import { useEffect, useState } from 'react';
import { GovernanceBodyType, DecisionCategory, DecisionStatus } from '@prisma/client';

interface Decision {
  id: string;
  decisionRef: string;
  title: string;
  summary: string;
  sourceBodyType: GovernanceBodyType;
  sourceMeeting: string;
  decidedAt: string;
  category: DecisionCategory;
  status: DecisionStatus;
  proposer: string;
  caseRef?: string;
}

interface Stats {
  total: number;
  approvedThisQuarter: number;
  deferred: number;
  rejected: number;
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

function truncateTitle(title: string, maxLength: number = 80): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength) + '...';
}

function DecisionRegisterContent() {
  const searchParams = useSearchParams();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const sourceBodyFilter = searchParams.get('sourceBody');
  const statusFilter = searchParams.get('status');
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('q');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch decisions
        const params = new URLSearchParams();
        if (sourceBodyFilter) params.append('sourceBodyType', sourceBodyFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (categoryFilter) params.append('category', categoryFilter);
        if (searchQuery) params.append('q', searchQuery);

        const response = await fetch(`/api/dss/decisions?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setDecisions(data);
        }

        // Fetch stats
        const statsResponse = await fetch('/api/dss/decisions/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching decisions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sourceBodyFilter, statusFilter, categoryFilter, searchQuery]);

  const bodyTypes: GovernanceBodyType[] = [
    'BOARD_OF_GOVERNORS',
    'SYNDICATE',
    'ACADEMIC_COUNCIL',
    'ASRB',
  ];

  const categories: DecisionCategory[] = [
    'STRATEGIC',
    'ACADEMIC',
    'FINANCIAL',
    'HR',
    'RESEARCH',
    'COMPLIANCE',
    'STUDENT_AFFAIRS',
    'OPERATIONS',
  ];

  const statuses: DecisionStatus[] = [
    'APPROVED',
    'CONDITIONALLY_APPROVED',
    'DEFERRED',
    'REJECTED',
    'RATIFIED',
    'RESCINDED',
  ];

  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    window.history.pushState(null, '', `?${params.toString()}`);
  };

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Fraunces', fontSize: '30px', margin: '0 0 8px 0' }}>
          Decision Register
        </h1>
        <p
          style={{
            fontStyle: 'italic',
            color: 'var(--slate)',
            margin: 0,
            fontSize: '14px',
          }}
        >
          Formal decisions across all governance bodies — Board, Syndicate, Academic Council, ASRB
        </p>
      </div>

      {/* KPI Tiles */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <KpiTile label="Total Decisions" value={stats.total.toString()} />
          <KpiTile
            label="Approved This Quarter"
            value={stats.approvedThisQuarter.toString()}
          />
          <KpiTile label="Deferred" value={stats.deferred.toString()} />
          <KpiTile label="Rejected" value={stats.rejected.toString()} />
        </div>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--slate)' }}>
            SOURCE BODY
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Tag
              label="All"
              isActive={!sourceBodyFilter}
              onClick={() => handleFilterChange('sourceBody', null)}
            />
            {bodyTypes.map((bodyType) => (
              <Tag
                key={bodyType}
                label={getSourceBodyAbbr(bodyType)}
                isActive={sourceBodyFilter === bodyType}
                onClick={() => handleFilterChange('sourceBody', bodyType)}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--slate)' }}>
            STATUS
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Tag
              label="All"
              isActive={!statusFilter}
              onClick={() => handleFilterChange('status', null)}
            />
            {statuses.map((status) => (
              <Tag
                key={status}
                label={status.replace(/_/g, ' ')}
                isActive={statusFilter === status}
                onClick={() => handleFilterChange('status', status)}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--slate)' }}>
            CATEGORY
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Tag
              label="All"
              isActive={!categoryFilter}
              onClick={() => handleFilterChange('category', null)}
            />
            {categories.map((category) => (
              <Tag
                key={category}
                label={category.replace(/_/g, ' ')}
                isActive={categoryFilter === category}
                onClick={() => handleFilterChange('category', category)}
              />
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--slate)' }}>
            SEARCH
          </div>
          <input
            type="text"
            placeholder="Search decisions..."
            defaultValue={searchQuery || ''}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange('q', value || null);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--slate-light)',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </Card>

      {/* Table */}
      <Card style={{ overflow: 'hidden' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
          data-testid="decision-register-list"
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--slate-light)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--slate)',
                }}
              >
                Ref
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--slate)',
                }}
              >
                Title
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--slate)',
                }}
              >
                Source
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--slate)',
                }}
              >
                Decided Date
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--slate)',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--slate)',
                }}
              >
                Category
              </th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((decision) => (
              <tr
                key={decision.id}
                style={{
                  borderBottom: '1px solid var(--slate-light)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={{ padding: '12px 16px' }}>
                  <Link
                    href={`/dss/decision-register/${decision.decisionRef}`}
                    style={{ color: 'var(--link)', textDecoration: 'none' }}
                  >
                    <strong>{decision.decisionRef}</strong>
                  </Link>
                </td>
                <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                  <Link
                    href={`/dss/decision-register/${decision.decisionRef}`}
                    style={{ color: 'var(--link)', textDecoration: 'none' }}
                  >
                    {truncateTitle(decision.title)}
                  </Link>
                </td>
                <td style={{ padding: '12px 16px' }}>
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
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                  {new Date(decision.decidedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusPill
                    label={decision.status.replace(/_/g, ' ')}
                    variant={getStatusPillVariant(decision.status)}
                  />
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                  {decision.category.replace(/_/g, ' ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {decisions.length === 0 && !loading && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--slate)' }}>
            No decisions found matching your filters.
          </div>
        )}

        {loading && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--slate)' }}>
            Loading decisions...
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DecisionRegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px' }}>Loading...</div>}>
      <DecisionRegisterContent />
    </Suspense>
  );
}
