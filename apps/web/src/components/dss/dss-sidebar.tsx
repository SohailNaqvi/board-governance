'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  {
    title: 'Governance',
    items: [
      { label: 'Strategic Cockpit', href: '/dss', count: undefined },
      { label: 'Syndicate', href: '/dss/syndicate', count: 14 },
      { label: 'ASRB', href: '/dss/asrb', count: 23 },
      { label: 'Academic Council', href: '/dss/academic-council', count: 6 },
      { label: 'Board of Governors', href: '/dss/board-of-governors', count: 2 },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Action Tracker', href: '/dss/action-tracker', count: 41 },
      { label: 'Decision Register', href: '/dss/decision-register', count: undefined },
      { label: 'Enrolment Forecast', href: '/dss/enrolment-forecast', count: undefined },
      { label: 'Early Warning', href: '/dss/early-warning', count: undefined },
      { label: 'Research Pipeline', href: '/dss/research-pipeline', count: undefined },
      { label: 'Space Utilisation', href: '/dss/space-utilisation', count: undefined },
      { label: 'Financial Health', href: '/dss/financial-health', count: undefined },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'APCE', href: '/dss/apce', count: undefined },
      { label: 'Data Lineage', href: '/dss/data-lineage', count: undefined },
      { label: 'Semantic Layer', href: '/dss/semantic-layer', count: undefined },
    ],
  },
];

interface DssSidebarProps {
  currentPath?: string;
}

export default function DssSidebar({ currentPath }: DssSidebarProps) {
  const pathname = usePathname();
  const activePath = currentPath || pathname;

  return (
    <div
      style={{
        width: '220px',
        backgroundColor: 'var(--ink)',
        padding: '28px 20px',
        overflowY: 'auto',
      }}
    >
      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: '32px' }}>
          <h3
            style={{
              fontSize: '10px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--muted)',
              marginBottom: '12px',
              paddingLeft: '12px',
            }}
          >
            {section.title}
          </h3>
          <div>
            {section.items.map((item) => {
              const isActive = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    marginBottom: '4px',
                    fontSize: '13px',
                    fontWeight: isActive ? '500' : '400',
                    color: isActive ? 'var(--ink)' : 'var(--line)',
                    backgroundColor: isActive ? 'var(--amber-bg)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--amber)' : '3px solid transparent',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: isActive ? 'var(--amber)' : 'var(--muted)',
                        marginLeft: '8px',
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
