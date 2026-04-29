'use client';

interface KpiTileProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaType?: 'up' | 'down' | 'flag';
  isMock?: boolean;
}

export default function KpiTile({ label, value, delta, deltaType = 'flag', isMock = false }: KpiTileProps) {
  let deltaColor = 'var(--muted)';
  let deltaArrow = '';

  if (deltaType === 'up') {
    deltaColor = 'var(--sage)';
    deltaArrow = '↑';
  } else if (deltaType === 'down') {
    deltaColor = 'var(--rose)';
    deltaArrow = '↓';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--muted)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '32px',
          fontFamily: "'Fraunces', serif",
          fontWeight: '700',
          color: 'var(--ink)',
        }}
      >
        {value}
      </div>
      {delta !== undefined && (
        <div
          style={{
            fontSize: '12px',
            color: deltaColor,
            fontWeight: '500',
          }}
        >
          {deltaArrow} {Math.abs(delta)}%
        </div>
      )}
      {isMock && (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            fontStyle: 'italic',
          }}
          data-testid="kpi-mock-label"
        >
          (mock)
        </div>
      )}
    </div>
  );
}
