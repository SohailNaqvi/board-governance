'use client';

import React from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  tag?: React.ReactNode;
  children: React.ReactNode;
  aiNote?: React.ReactNode;
}

export default function Card({
  title,
  subtitle,
  tag,
  children,
  aiNote,
}: CardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--ink)',
              margin: '0 0 4px 0',
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontSize: '12px',
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {tag && <div>{tag}</div>}
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>{children}</div>

      {/* AI Note Footer */}
      {aiNote && (
        <div
          style={{
            padding: '0 20px 20px 20px',
          }}
        >
          {aiNote}
        </div>
      )}
    </div>
  );
}
