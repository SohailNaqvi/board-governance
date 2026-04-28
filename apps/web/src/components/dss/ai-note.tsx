'use client';

interface AiNoteProps {
  children: React.ReactNode;
}

export default function AiNote({ children }: AiNoteProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 0',
        borderTop: '1px solid var(--line)',
        marginTop: '12px',
        fontSize: '11px',
        color: 'var(--muted)',
        fontStyle: 'italic',
      }}
    >
      <span
        style={{
          fontSize: '9px',
          fontWeight: '700',
          backgroundColor: 'var(--teal-bg)',
          color: 'var(--teal)',
          padding: '2px 6px',
          borderRadius: '3px',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        AI
      </span>
      <div>{children}</div>
    </div>
  );
}
