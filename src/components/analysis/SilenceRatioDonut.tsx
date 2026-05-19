interface SilenceRatioDonutProps {
  speechRatioPercent: number;
  speechMs: number;
  silenceMs: number;
}

function formatMs(ms: number): string {
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(0)} s`;
  return `${(sec / 60).toFixed(1)} min`;
}

export function SilenceRatioDonut({ speechRatioPercent, speechMs, silenceMs }: SilenceRatioDonutProps) {
  const speechPct = Math.min(100, Math.max(0, speechRatioPercent));
  const silencePct = 100 - speechPct;

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Speech vs Silence</h3>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `conic-gradient(var(--color-primary) 0% ${speechPct}%, var(--color-border) ${speechPct}% 100%)`,
            flexShrink: 0,
          }}
          aria-hidden
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <div>
            <strong>Speech</strong>: {speechPct.toFixed(1)}% ({formatMs(speechMs)})
          </div>
          <div style={{ color: 'var(--color-text-muted)' }}>
            <strong>Silence</strong>: {silencePct.toFixed(1)}% ({formatMs(silenceMs)})
          </div>
        </div>
      </div>
    </div>
  );
}
