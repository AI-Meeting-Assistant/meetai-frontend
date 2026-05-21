import { type ReactNode } from 'react';

interface PageHeaderProps {
  onBack?: () => void;
  backLabel?: string;
  title: string;
  statusLabel?: ReactNode;
  actions?: ReactNode;
  error?: string | null;
}

function ChevronLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function PageHeader({ onBack, backLabel = 'Back', title, statusLabel, actions, error }: PageHeaderProps) {
  return (
    <header style={{ marginBottom: 36 }}>
      {/* Back button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: 'var(--tx-3)', background: 'none',
            border: 'none', cursor: 'pointer', marginBottom: 12,
            padding: 0, whiteSpace: 'nowrap', transition: 'color 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-1)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-3)')}
        >
          <ChevronLeft /> {backLabel}
        </button>
      )}

      {/* Title row + actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--tx-1)', margin: 0 }}>
              {title}
            </h1>
            {statusLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {statusLabel}
              </div>
            )}
          </div>
          {error && (
            <p style={{ fontSize: 12, color: 'var(--red)', margin: '6px 0 0' }}>{error}</p>
          )}
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
