'use client';

interface AlertBannerProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta?: () => void;
}

export default function AlertBanner({
  title,
  subtitle,
  ctaLabel,
  onCta,
}: AlertBannerProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        borderRadius: '6px',
        background: 'linear-gradient(135deg, var(--amber-bg), #FFF8E8)',
        border: '1px solid var(--amber)',
      }}
    >
      <div
        style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--amber)',
          lineHeight: 1,
        }}
      >
        !
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--ink)',
            marginBottom: '4px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--muted)',
            lineHeight: '1.4',
          }}
        >
          {subtitle}
        </div>
      </div>
      <button
        onClick={onCta}
        style={{
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--panel)',
          backgroundColor: 'var(--amber)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#B87520';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--amber)';
        }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
