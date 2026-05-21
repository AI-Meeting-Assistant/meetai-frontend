export function SettingsPage() {
  return (
    <main className="page">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--tx-1)' }}>
          Settings
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--tx-3)' }}>
          Organization and account configuration.
        </p>
      </div>

      <div className="card" style={{ padding: '36px 24px', textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--bg-subtle)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tx-3)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-2)', marginBottom: 6 }}>
          Coming soon
        </div>
        <div style={{ fontSize: 12, color: 'var(--tx-3)', maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
          Organization settings, notification preferences, and integrations will appear here.
        </div>
      </div>
    </main>
  );
}
