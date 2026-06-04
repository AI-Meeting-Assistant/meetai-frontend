// @trace UC-04-NF — transcript display from fused payload
// @trace UC-02.3-NF — speaker-prefixed lines

import { describe, expect, it } from 'vitest';
import {
  buildTranscriptBlocksFromTimeline,
  extractTranscriptLines,
  parseFusedTranscriptText,
} from '../../src/utils/liveTranscript';

describe('liveTranscript', () => {
  it('prefers structured transcriptLines', () => {
    const lines = extractTranscriptLines(
      [{ speaker: 'Speaker 1', text: 'Hello' }],
      'Speaker 2: ignored',
    );
    expect(lines).toEqual([{ speaker: 'Speaker 1', text: 'Hello' }]);
  });

  it('parses flat transcript string', () => {
    const lines = parseFusedTranscriptText('Speaker 1: hi\nSpeaker 2: bye');
    expect(lines).toHaveLength(2);
    expect(lines[0].speaker).toBe('Speaker 1');
    expect(lines[1].text).toBe('bye');
  });

  it('builds blocks from timeline entries', () => {
    const blocks = buildTranscriptBlocksFromTimeline([
      {
        id: '1',
        meetingId: 'm',
        offsetMs: 6000,
        payload: {
          audio: { transcriptLines: [{ speaker: 'A', text: 'one' }] },
        },
      },
      {
        id: '2',
        meetingId: 'm',
        offsetMs: 0,
        payload: { audio: { transcript: null } },
      },
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].offsetMs).toBe(6000);
  });
});
