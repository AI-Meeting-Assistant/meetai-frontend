
interface SpeakingRatePieChartProps {
  speakingRate: number; // 0 to 100
}

export function SpeakingRatePieChart({ speakingRate }: SpeakingRatePieChartProps) {
  const radius = 80;
  const stroke = 14;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const clamped = Math.min(100, Math.max(0, speakingRate));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Healthy speaking-rate band: 40–75% ideal, 25–85% acceptable, else off
  const strokeColor =
    clamped >= 40 && clamped <= 75 ? 'var(--color-success)' :
    clamped >= 25 && clamped <= 85 ? 'var(--color-warning)' :
    'var(--color-danger)';

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="panel-header" style={{ width: '100%', marginBottom: 'var(--space-6)' }}>
        <h3>Speaking Rate</h3>
      </div>

      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg
          height={radius * 2}
          width={radius * 2}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            stroke="var(--color-border)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-in-out, stroke 1s ease-in-out',
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text)',
            lineHeight: 1,
          }}>
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
    </div>
  );
}
