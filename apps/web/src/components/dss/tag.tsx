'use client';

interface TagProps {
  label: string;
  variant: 'teal' | 'amber' | 'rose' | 'sage';
}

function getTagColor(variant: 'teal' | 'amber' | 'rose' | 'sage'): {
  bg: string;
  text: string;
} {
  switch (variant) {
    case 'teal':
      return { bg: 'var(--teal-bg)', text: 'var(--teal)' };
    case 'amber':
      return { bg: 'var(--amber-bg)', text: 'var(--amber)' };
    case 'rose':
      return { bg: 'var(--rose-bg)', text: 'var(--rose)' };
    case 'sage':
      return { bg: 'var(--sage-bg)', text: 'var(--sage)' };
  }
}

export default function Tag({ label, variant }: TagProps) {
  const colors = getTagColor(variant);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: '10px',
        fontWeight: '700',
        borderRadius: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
      }}
    >
      {label}
    </div>
  );
}
