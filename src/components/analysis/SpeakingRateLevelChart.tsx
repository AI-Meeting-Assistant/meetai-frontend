import { useMemo } from "react";
import type { MeetingTimelineEntry, FusedDataPayload } from "../../types";

interface SpeakingRateLevelChartProps {
  timeline: MeetingTimelineEntry[];
}

const LINE_COLOR = "#60A5FA";

export function SpeakingRateLevelChart({ timeline }: SpeakingRateLevelChartProps) {
  const dataPoints = useMemo(() => {
    return timeline
      .map((entry) => {
        const payload = entry.payload as Partial<FusedDataPayload>;
        const ratio = payload?.audio?.vadSpeechRatioPercent;
        return {
          offset: entry.offsetMs || payload?.offsetMs || 0,
          ratio: typeof ratio === "number" ? Math.min(100, Math.max(0, ratio)) : 0,
        };
      })
      .sort((a, b) => a.offset - b.offset);
  }, [timeline]);

  const height = 200;
  const width = 600;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 20;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxOffset =
    dataPoints.length > 0
      ? Math.max(...dataPoints.map((d) => d.offset), 1000)
      : 1000;

  const points = dataPoints
    .map((d) => {
      const x = paddingLeft + (d.offset / maxOffset) * chartWidth;
      const y = height - paddingBottom - (d.ratio / 100) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  let fillPoints = "";
  if (dataPoints.length > 0) {
    const firstX =
      paddingLeft + (dataPoints[0].offset / maxOffset) * chartWidth;
    const lastX =
      paddingLeft +
      (dataPoints[dataPoints.length - 1].offset / maxOffset) * chartWidth;
    fillPoints = `${firstX},${height - paddingBottom} ${points} ${lastX},${height - paddingBottom}`;
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
      <div className="panel-header" style={{ marginBottom: "var(--space-4)" }}>
        <h3>Speaking Rate</h3>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", overflow: "visible" }}
        >
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={width - paddingRight}
            y2={paddingTop}
            stroke="var(--color-border)"
            strokeDasharray="4"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight / 2}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight / 2}
            stroke="var(--color-border)"
            strokeDasharray="4"
          />
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="var(--color-border)"
          />

          <text
            x={paddingLeft - 5}
            y={paddingTop}
            fontSize="10"
            fill="var(--color-text-muted)"
            textAnchor="end"
            dominantBaseline="middle"
          >
            100%
          </text>
          <text
            x={paddingLeft - 5}
            y={paddingTop + chartHeight / 2}
            fontSize="10"
            fill="var(--color-text-muted)"
            textAnchor="end"
            dominantBaseline="middle"
          >
            50%
          </text>
          <text
            x={paddingLeft - 5}
            y={height - paddingBottom}
            fontSize="10"
            fill="var(--color-text-muted)"
            textAnchor="end"
            dominantBaseline="middle"
          >
            0%
          </text>

          <text
            x={paddingLeft}
            y={height - paddingBottom + 12}
            fontSize="10"
            fill="var(--color-text-muted)"
            textAnchor="start"
            dominantBaseline="hanging"
          >
            0:00
          </text>
          {dataPoints.length > 0 && (
            <text
              x={width - paddingRight}
              y={height - paddingBottom + 12}
              fontSize="10"
              fill="var(--color-text-muted)"
              textAnchor="end"
              dominantBaseline="hanging"
            >
              {formatTime(maxOffset)}
            </text>
          )}

          {points && (
            <>
              <polygon
                fill={LINE_COLOR}
                fillOpacity="0.15"
                points={fillPoints}
              />
              <polyline
                fill="none"
                stroke={LINE_COLOR}
                strokeWidth="2"
                points={points}
              />
            </>
          )}

          {dataPoints.map((d, i) => {
            const x = paddingLeft + (d.offset / maxOffset) * chartWidth;
            const y = height - paddingBottom - (d.ratio / 100) * chartHeight;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill="var(--color-surface)"
                stroke={LINE_COLOR}
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        {dataPoints.length === 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-muted)",
              pointerEvents: "none",
            }}
          >
            No speech data yet.
          </div>
        )}
      </div>
    </div>
  );
}
