'use client';

interface ActionRowProps {
  description: string;
  owner: string;
  status: 'on-track' | 'at-risk' | 'overdue' | 'done';
  due: string;
}

function getStatusColor(
  status: 'on-track' | 'at-risk' | 'overdue' | 'done'
): { bg: string; text: string } {
  switch (status) {
    case 'on-track':
      return { bg: 'var(--sage-bg)', text: 'var(--sage)' };
    case 'at-risk':
      return { bg: 'var(--amber-bg)', text: 'var(--amber)' };
    case 'overdue':
      return { bg: 'var(--rose-bg)', text: 'var(--rose)' };
    case 'done':
      return { bg: 'var(--teal-bg)', text: 'var(--teal)' };
  }
}

export default function ActionRow({
  description,
  owner,
  status,
  due,
}: ActionRowProps) {
  const statusColors = getStatusColor(status);
  const statusLabel = status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 140px 100px',
        gap: '16px',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--ink)',
            marginBottom: '4px',
          }}
        >
          {description}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
          }}
        >
          {owner}
        </div>
      </div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          backgroundColor: statusColors.bg,
          color: statusColors.text,
          fontSize: '11px',
          fontWeight: '600',
          borderRadius: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}
      >
        {statusLabel}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: 'var(--muted)',
          textAlign: 'right',
        }}
      >
        {due}
      </div>
    </div>
  );
}
