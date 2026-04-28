'use client';

interface StatusPillProps {
  status: 'on-track' | 'at-risk' | 'overdue' | 'done';
  label?: string;
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

export default function StatusPill({ status, label }: StatusPillProps) {
  const colors = getStatusColor(status);
  const displayLabel = label || status.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: '11px',
        fontWeight: '600',
        borderRadius: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
      }}
    >
      {displayLabel}
    </div>
  );
}
