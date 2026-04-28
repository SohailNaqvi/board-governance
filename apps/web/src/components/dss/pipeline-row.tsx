'use client';

interface PipelineRowProps {
  name: string;
  department: string;
  score: number;
}

export default function PipelineRow({ name, department, score }: PipelineRowProps) {
  const scoreColor =
    score >= 80 ? 'var(--sage)' : score >= 60 ? 'var(--amber)' : 'var(--rose)';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 120px 80px',
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
          {name}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
          }}
        >
          {department}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            flex: 1,
            height: '6px',
            backgroundColor: 'var(--line)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${score}%`,
              backgroundColor: scoreColor,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: scoreColor,
            minWidth: '30px',
            textAlign: 'right',
          }}
        >
          {score}%
        </div>
      </div>
    </div>
  );
}
