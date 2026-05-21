import { useEffect, useRef, useState, type ReactNode } from 'react';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Animation durations must match the CSS keyframe durations exactly.
const PANEL_MS    = 320;
const BACKDROP_MS = 250;

export function SlideOver({ open, onClose, title, children, footer, width = 460 }: SlideOverProps) {
  // `mounted`  — whether the DOM nodes exist at all
  // `closing`  — whether we're mid-exit animation (open=false but still visible)
  const [mounted, setMounted]   = useState(open);
  const [closing, setClosing]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      clearTimeout(timerRef.current);
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
      timerRef.current = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, Math.max(PANEL_MS, BACKDROP_MS));
    }
    return () => clearTimeout(timerRef.current);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  const backdropAnim = closing
    ? `fadeOut ${BACKDROP_MS}ms ease forwards`
    : `fadeIn ${BACKDROP_MS}ms ease`;

  const panelAnim = closing
    ? `slideOutRight ${PANEL_MS}ms cubic-bezier(0.32, 0.72, 0, 1) forwards`
    : `slideInRight ${PANEL_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="slideover-backdrop"
        style={{ animation: backdropAnim }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="slideover-panel"
        style={{ width, animation: panelAnim }}
      >
        <div className="slideover-header">
          <span>{title}</span>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--tx-3)', transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--tx-1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--tx-3)'; }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="slideover-body">{children}</div>

        {footer && <div className="slideover-footer">{footer}</div>}
      </div>
    </>
  );
}
