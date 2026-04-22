import type { MeetingTimelineEntry } from '../../types';

export function TimelineViewer({ entries }: { entries: MeetingTimelineEntry[] }) {
  return (
    <section>
      <h3>Timeline</h3>
      {entries.map((entry, index) => (
        <pre key={`${entry.offsetMs}-${index}`}>{JSON.stringify(entry, null, 2)}</pre>
      ))}
    </section>
  );
}
