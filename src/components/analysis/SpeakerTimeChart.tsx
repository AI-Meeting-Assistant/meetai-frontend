import { useMemo } from 'react';
import type { MeetingTimelineEntry, FusedDataPayload, RecordedAnalysisPayload, RecordedSpeaker } from '../../types';

interface SpeakerTimeChartProps {
  timeline?: MeetingTimelineEntry[];
  recordedSpeakers?: RecordedSpeaker[];
}

type SpeakerTimePayload = Partial<FusedDataPayload> & {
  recorded?: Partial<RecordedAnalysisPayload['recorded']>;
};

export function SpeakerTimeChart({ timeline = [], recordedSpeakers }: SpeakerTimeChartProps) {
  const speakerTimes = useMemo(() => {
    const times: Record<string, number> = {};
    let totalSpeechMs = 0;

    if (recordedSpeakers && recordedSpeakers.length > 0) {
      for (const sp of recordedSpeakers) {
        if (typeof sp.talkMs === 'number' && sp.talkMs > 0) {
          times[sp.label] = (times[sp.label] || 0) + sp.talkMs;
          totalSpeechMs += sp.talkMs;
        }
      }
    } else {
      for (const entry of timeline) {
        const payload = entry.payload as SpeakerTimePayload | null;
        if (!payload) continue;

        const speakersFromPayload = payload.recorded?.speakers;
        if (speakersFromPayload && speakersFromPayload.length > 0) {
          for (const sp of speakersFromPayload) {
            if (typeof sp.talkMs === 'number' && sp.talkMs > 0) {
              times[sp.label] = (times[sp.label] || 0) + sp.talkMs;
              totalSpeechMs += sp.talkMs;
            }
          }
          continue;
        }

        const speakerTalkMs = payload.audio?.speakerTalkMs;
        if (speakerTalkMs && typeof speakerTalkMs === 'object') {
          for (const [speaker, ms] of Object.entries(speakerTalkMs)) {
            if (typeof ms === 'number' && ms > 0) {
              times[speaker] = (times[speaker] || 0) + ms;
              totalSpeechMs += ms;
            }
          }
          continue;
        }

        const speechMs = payload.audio?.vadSpeechMs || 0;
        const speakers = (payload.audio?.speakerLabelsWindow || []) as Array<{ speaker?: string }>;
        if (speechMs > 0) {
          const speaker = speakers.length > 0 ? (speakers[0].speaker || 'UNKNOWN') : 'UNKNOWN';
          times[speaker] = (times[speaker] || 0) + speechMs;
          totalSpeechMs += speechMs;
        }
      }
    }

    const sorted = Object.entries(times)
      .sort((a, b) => b[1] - a[1])
      .map(([speaker, ms]) => ({ speaker, ms }));

    return { sorted, totalSpeechMs };
  }, [timeline, recordedSpeakers]);

  const { sorted, totalSpeechMs } = speakerTimes;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(1)} s`;
    return `${(s / 60).toFixed(1)} min`;
  };

  return (
    <div className="card">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 16 }}>Speaker Time</div>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--tx-3)', fontStyle: 'italic', margin: 0 }}>
          Waiting for speakers…
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map(({ speaker, ms }) => {
            const pct = totalSpeechMs > 0 ? (ms / totalSpeechMs) * 100 : 0;
            return (
              <div key={speaker}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--tx-2)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                    {speaker}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx-3)' }}>
                    {formatTime(ms)} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: 'var(--accent)', borderRadius: 3,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
