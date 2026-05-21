interface SpeakingRatePieChartProps {
  speakingRate: number;
  size?: number;
}

export function SpeakingRatePieChart({ speakingRate, size = 160 }: SpeakingRatePieChartProps) {
  const stroke = Math.max(8, Math.round(size * 0.09));
  const r = (size - stroke) / 2;
  const cir = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, speakingRate));
  const offset = cir * (1 - clamped / 100);

  const color =
    clamped >= 40 && clamped <= 75 ? 'var(--green)'  :
    clamped >= 25 && clamped <= 85 ? 'var(--amber)'  :
    'var(--red)';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 20, alignSelf: 'flex-start' }}>
        Speaking Rate
      </div>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={cir} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: size / 5.5, fontWeight: 600, color: 'var(--tx-1)' }}>
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
    </div>
  );
}
