'use client';

interface SectionPlaceholderProps {
  sectionName: string;
  description: string;
}

export default function SectionPlaceholder({
  sectionName,
  description,
}: SectionPlaceholderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '32px',
      }}
    >
      <h1
        style={{
          fontSize: '28px',
          fontFamily: "'Fraunces', serif",
          fontWeight: '700',
          color: 'var(--ink)',
          margin: 0,
        }}
      >
        {sectionName}
      </h1>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--muted)',
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}
