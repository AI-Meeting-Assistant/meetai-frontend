// @trace UC-04-NF-4 — dashboard metrics from timeline
// @trace NFR-USA-02 — chart data derived from fused payload

import { describe, expect, it } from 'vitest';
import {
  computeAverageAgendaPercent,
  computeAverageFocusPercent,
  computeAverageSpeakingRatePercent,
  getLatestAgendaPercent,
} from '../../src/utils/timelineMetrics';
import type { MeetingTimelineEntry } from '../../src/types';

function entry(offsetMs: number, payload: Record<string, unknown>): MeetingTimelineEntry {
  return { id: '1', meetingId: 'm', offsetMs, payload };
}

describe('timelineMetrics', () => {
  const timeline: MeetingTimelineEntry[] = [
    entry(0, { video: { focusScore: 0.8 }, audio: { vadSpeechRatioPercent: 60 } }),
    entry(2000, { video: { focusScore: 0.6 }, audio: { vadSpeechRatioPercent: 40 } }),
    entry(4000, { context: { contextFit: 0.9 }, offsetMs: 4000 }),
    entry(6000, { context: { contextFit: 0.5 }, offsetMs: 6000 }),
  ];

  it('computes average focus percent', () => {
    expect(computeAverageFocusPercent(timeline)).toBe(70);
  });

  it('computes average speaking rate percent', () => {
    expect(computeAverageSpeakingRatePercent(timeline)).toBe(50);
  });

  it('picks latest agenda percent by offset', () => {
    expect(getLatestAgendaPercent(timeline)).toBe(50);
  });

  it('computes average agenda percent', () => {
    expect(computeAverageAgendaPercent(timeline)).toBe(70);
  });

  it('returns zero focus when no scores', () => {
    expect(computeAverageFocusPercent([entry(0, { audio: {} })])).toBe(0);
  });
});
