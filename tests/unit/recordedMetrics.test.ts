// @trace UC-07-NF — recorded meeting metrics from batch payload
// @trace UC-04-NF — post-meeting dashboard aggregates

import { describe, expect, it } from 'vitest';
import { getRecordedAgendaPercent, getRecordedSpeakingPercent } from '../../src/utils/recordedMetrics';

describe('recordedMetrics', () => {
  it('reads agenda percent from recorded payload', () => {
    const pct = getRecordedAgendaPercent({
      recorded: { adherence: { score: 0.72 } },
    } as import('../../src/types').RecordedAnalysisPayload);
    expect(pct).toBe(72);
  });

  it('reads speaking ratio from audio vad field', () => {
    const pct = getRecordedSpeakingPercent({
      audio: { vadSpeechRatioPercent: 55 },
    } as import('../../src/types').RecordedAnalysisPayload);
    expect(pct).toBe(55);
  });
});
