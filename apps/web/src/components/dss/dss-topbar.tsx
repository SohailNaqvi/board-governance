'use client';

interface DssTopbarProps {
  userName: string;
  userEmail: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || 'U').toUpperCase();
}

export default function DssTopbar({ userName, userEmail }: DssTopbarProps) {
  const initials = getInitials(userName);

  return (
    <div
      style={{
        height: '56px',
        backgroundColor: 'var(--ink-2)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '28px',
        paddingRight: '28px',
        borderBottom: '1px solid var(--line-strong)',
        gap: '16px',
      }}
    >
      {/* Brand */}
      <div
        style={{
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        Knowledge Streams
        <span style={{ color: 'var(--amber)' }}>·</span>
        <span>DSS</span>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '28px',
          backgroundColor: 'var(--line-strong)',
        }}
      />

      {/* Context (spacer for now) */}
      <div style={{ flex: 1 }} />

      {/* Status indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--muted)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--teal)',
          }}
        />
        <span>Live</span>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '28px',
          backgroundColor: 'var(--line-strong)',
        }}
      />

      {/* User pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingTop: '6px',
          paddingBottom: '6px',
          backgroundColor: 'var(--ink)',
          borderRadius: '20px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'var(--amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--panel)',
          }}
        >
          {initials}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--line)' }}>
          <div style={{ fontWeight: '500', color: 'var(--panel)' }}>{userName}</div>
          <div>{userEmail}</div>
        </div>
      </div>
    </div>
  );
}
