import { useEffect, useRef, useState } from 'react';

export interface LineChartPoint { x: number; y: number; }

interface LineChartCardProps {
  title: string;
  data: LineChartPoint[];
  color: string;
  avg?: number | null;
  emptyLabel?: string;
  height?: number;
  yMax?: number;
  yTicks?: number[];
}

const PAD = { t: 10, r: 12, b: 28, l: 38 };

function fmtMs(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export function LineChartCard({
  title, data, color, avg,
  emptyLabel = 'No data yet.',
  height = 140,
  yMax = 100,
  yTicks = [0, 25, 50, 75, 100],
}: LineChartCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(500);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ob = new ResizeObserver(entries => setCw(entries[0].contentRect.width));
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const W = cw - PAD.l - PAD.r;
  const H = height - PAD.t - PAD.b;

  const hasData = data.length >= 2;
  const minX = hasData ? data[0].x : 0;
  const maxX = hasData ? data[data.length - 1].x : 1;

  const tx = (x: number) => ((x - minX) / (maxX - minX || 1)) * W + PAD.l;
  const ty = (y: number) => H - (Math.max(0, Math.min(yMax, y)) / yMax) * H + PAD.t;

  const pts  = hasData ? data.map(d => `${tx(d.x)},${ty(d.y)}`).join(' ') : '';
  const area = hasData
    ? `${PAD.l},${PAD.t + H} ${pts} ${tx(maxX)},${PAD.t + H}`
    : '';

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)' }}>{title}</span>
        {avg != null && (
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color, fontWeight: 600,
          }}>
            avg {Math.round(avg)}%
          </span>
        )}
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
        <svg
          width={cw}
          height={height}
          style={{ display: 'block', overflow: 'visible', fontFamily: 'var(--font-mono)' }}
        >
          {/* Y-axis grid lines + labels */}
          {yTicks.map(v => (
            <g key={v}>
              <line
                x1={PAD.l} y1={ty(v)} x2={PAD.l + W} y2={ty(v)}
                stroke="var(--border-subtle)" strokeWidth={0.5} strokeDasharray="3,4"
              />
              <text
                x={PAD.l - 6} y={ty(v)}
                textAnchor="end" dominantBaseline="middle"
                style={{ fontSize: 10, fill: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}
              >
                {v}
              </text>
            </g>
          ))}

          {/* Area fill */}
          {hasData && (
            <polygon points={area} fill={color} opacity={0.07} />
          )}

          {/* Line */}
          {hasData && (
            <polyline
              points={pts} fill="none"
              stroke={color} strokeWidth={1.5}
              strokeLinejoin="round" strokeLinecap="round"
            />
          )}

          {/* Data point dots */}
          {hasData && data.map((d, i) => (
            <circle
              key={i}
              cx={tx(d.x)} cy={ty(d.y)} r={2.5}
              fill="var(--bg-card)" stroke={color} strokeWidth={1.5}
            />
          ))}

          {/* X-axis labels */}
          <text
            x={PAD.l} y={height - 5}
            style={{ fontSize: 10, fill: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}
          >
            {fmtMs(minX)}
          </text>
          {hasData && (
            <text
              x={PAD.l + W} y={height - 5}
              textAnchor="end"
              style={{ fontSize: 10, fill: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}
            >
              {fmtMs(maxX)}
            </text>
          )}
        </svg>

        {/* Empty state overlay */}
        {!hasData && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: 'var(--tx-3)', fontStyle: 'italic',
            pointerEvents: 'none',
          }}>
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}
