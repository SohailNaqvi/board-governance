import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/session';
import DssTopbar from '@/components/dss/dss-topbar';
import DssSidebar from '@/components/dss/dss-sidebar';
import './dss-tokens.css';

export const metadata: Metadata = {
  title: 'DSS — University DSS',
};

export default async function DssLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  let session = null;

  if (sessionToken) {
    session = await verifySession(sessionToken);
  }

  const userName = session?.name || 'User';
  const userEmail = session?.email || '';

  return (
    <div className="dss-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DssTopbar userName={userName} userEmail={userEmail} />
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', flex: 1 }}>
        <DssSidebar />
        <main
          style={{
            backgroundColor: 'var(--bg)',
            overflowY: 'auto',
            padding: '28px 36px',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
