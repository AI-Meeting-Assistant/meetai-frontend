interface AudioDurationCardProps {
  durationMs: number;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function AudioDurationCard({ durationMs }: AudioDurationCardProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Duration</h3>
      </div>
      <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
        {formatDuration(durationMs)}
      </p>
    </div>
  );
}
