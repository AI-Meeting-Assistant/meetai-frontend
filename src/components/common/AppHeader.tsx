import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="var(--tx-3)" strokeWidth="2.5" strokeLinecap="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Logo ──────────────────────────────────────────────────────────────────────

export function AppLogo({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: 'var(--accent)', flexShrink: 0,
      }} />
      <span style={{
        fontSize: 19, fontWeight: 700,
        letterSpacing: '-0.045em',
        color: 'var(--tx-1)',
      }}>
        meetai
      </span>
    </div>
  );
}

// ── UserMenu pill ─────────────────────────────────────────────────────────────

export function UserMenu({ userName, userRole, onLogout }: {
  userName: string;
  userRole: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initial = userName?.[0]?.toUpperCase() ?? '?';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 10px 4px 4px',
          border: `1px solid ${open ? 'var(--accent-border)' : 'var(--border)'}`,
          borderRadius: 20,
          background: open ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
          cursor: 'pointer',
          transition: 'border-color 0.12s, background 0.12s',
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-border)';
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-subtle)';
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)';
          }
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
        }}>
          {initial}
        </div>
        {/* Name + role */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-1)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {userName}
          </div>
          <div style={{ fontSize: 10, color: 'var(--tx-3)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {userRole}
          </div>
        </div>
        <ChevronDownIcon open={open} />
      </button>

      {open && (
        <div className="dropdown-menu">
          {/* User info header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-1)' }}>{userName}</div>
            <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 1 }}>{userRole}</div>
          </div>
          {/* Items */}
          <div style={{ padding: '6px 0' }}>
            <button
              onClick={() => setOpen(false)}
              style={{ gap: 10 }}
            >
              <span style={{ fontSize: 14, opacity: 0.7 }}>⚙</span>
              Account settings
            </button>
          </div>
          {/* Sign out */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '6px 0' }}>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              style={{ gap: 10, color: 'var(--red)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <SignOutIcon />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AppHeader ─────────────────────────────────────────────────────────────────

export function AppHeader() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  const userName = user?.fullName ?? user?.email ?? 'User';
  const userRole = user?.role === 'MODERATOR' ? 'Moderator' : 'Viewer';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-header">
      <AppLogo onClick={() => navigate('/meetings')} />
      <div style={{ flex: 1 }} />
      <button
        className="profile-icon-btn"
        title={darkMode ? 'Light mode' : 'Dark mode'}
        onClick={toggleDarkMode}
        style={{ marginRight: 6 }}
      >
        {darkMode ? <SunIcon /> : <MoonIcon />}
      </button>
      <UserMenu
        userName={userName}
        userRole={userRole}
        onLogout={handleLogout}
      />
    </div>
  );
}
