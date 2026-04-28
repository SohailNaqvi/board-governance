'use client';

interface AgendaRowProps {
  number: string | number;
  body: string;
  meta: string;
  aiBadge?: boolean;
  action: string;
}

export default function AgendaRow({
  number,
  body,
  meta,
  aiBadge,
  action,
}: AgendaRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 120px',
        gap: '16px',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--ink)',
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {number}
      </div>
      <div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--ink)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {body}
          {aiBadge && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: '700',
                backgroundColor: 'var(--teal-bg)',
                color: 'var(--teal)',
                padding: '2px 6px',
                borderRadius: '3px',
                textTransform: 'uppercase',
              }}
            >
              AI
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
          }}
        >
          {meta}
        </div>
      </div>
      <div
        style={{
          fontSize: '11px',
          fontWeight: '500',
          color: 'var(--amber)',
          textAlign: 'right',
          cursor: 'pointer',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.color = '#B87520';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.color = 'var(--amber)';
        }}
      >
        {action}
      </div>
    </div>
  );
}
