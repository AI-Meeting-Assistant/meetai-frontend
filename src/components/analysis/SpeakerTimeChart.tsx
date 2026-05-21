import { useMemo } from 'react';
import type {
  MeetingTimelineEntry,
  FusedDataPayload,
  RecordedAnalysisPayload,
  RecordedSpeaker,
} from '../../types';

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
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)} s`;
    const mins = seconds / 60;
    return `${mins.toFixed(1)} min`;
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: 'var(--space-4)' }}>
        <h3>Speaker Time Chart</h3>
      </div>

      {sorted.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1, justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', opacity: 0.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
              <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-text-muted)' }}>Waiting for speakers...</span>
              <span style={{ color: 'var(--color-text-muted)' }}>0 s (0.0%)</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px' }} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {sorted.map(({ speaker, ms }) => {
            const percentage = totalSpeechMs > 0 ? (ms / totalSpeechMs) * 100 : 0;
            return (
              <div key={speaker} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                  <span style={{ fontWeight: 'var(--font-medium)' }}>{speaker}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{formatTime(ms)} ({percentage.toFixed(1)}%)</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: 'var(--color-border)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: 'var(--color-primary)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
