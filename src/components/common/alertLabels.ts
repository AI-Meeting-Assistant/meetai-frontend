const EVENT_TYPE_LABELS: Record<string, string> = {
  FOCUS_DROP:              'Focus Level Dropped',
  FOCUS_RECOVERED:         'Focus Level Recovered',
  SPEAKING_RATE_DROP:      'Speaking Rate Dropped',
  SPEAKING_RATE_RECOVERED: 'Speaking Rate Recovered',
  AGENDA_DEVIATION:        'Agenda Deviation Detected',
  AGENDA_FIT:              'Agenda On Track',
};

/** Returns a human-readable label for an SSE event type string. */
export function eventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type]
    ?? type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
