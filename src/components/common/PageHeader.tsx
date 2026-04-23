import { type ReactNode } from 'react';

interface PageHeaderProps {
  onBack?: () => void;
  backLabel?: string;
  title: string;
  statusLabel?: ReactNode;
  actions?: ReactNode;
  error?: string | null;
}

export function PageHeader({ 
  onBack, 
  backLabel = 'Back', 
  title, 
  statusLabel, 
  actions, 
  error 
}: PageHeaderProps) {
  return (
    <header className="page-header-container">
      {/* Top Row: Navigation and Actions */}
      <div className="header-row-top">
        {onBack ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', whiteSpace: 'nowrap' }}
          >
            ← {backLabel}
          </button>
        ) : <div />}

        <div className="header-actions">
          {error && (
            <span className="stream-error-inline">{error}</span>
          )}
          {actions}
        </div>
      </div>

      {/* Bottom Row: Title and Status */}
      <div className="header-row-bottom">
        <h1 style={{ margin: 0 }}>{title}</h1>
        {statusLabel && (
          <div className="header-status-wrapper">
            {statusLabel}
          </div>
        )}
      </div>
    </header>
  );
}
