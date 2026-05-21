// ── Design token references ───────────────────────────────────────────────────
// Single source of truth for semantic color strings used in JS/TSX.
// Structural tokens (--tx-*, --bg-*, --border*) stay inline — they're layout
// concerns, not semantic choices.

export const colors = {
  accent:        'var(--accent)',
  accentSubtle:  'var(--accent-subtle)',
  accentBorder:  'var(--accent-border)',
  accentFg:      'var(--accent-fg)',
  green:         'var(--green)',
  greenBg:       'var(--green-bg)',
  amber:         'var(--amber)',
  amberBg:       'var(--amber-bg)',
  red:           'var(--red)',
  redBg:         'var(--red-bg)',
  purple:        'var(--purple)',
  purpleBg:      'var(--purple-bg)',
} as const;

// ── Metric colors — static, used on the analysis (post-meeting) page ──────────

export const metricColors = {
  focus:    colors.purple,  // purple — no semantic "good/bad" judgment
  speaking: colors.accent,  // blue
  agenda:   colors.green,   // green
} as const;

// ── Dynamic color functions — used on the live dashboard ─────────────────────

/** Focus level: green ≥ 75 · amber 50–74 · red < 50 */
export function focusColor(pct: number): string {
  if (pct >= 75) return colors.green;
  if (pct >= 50) return colors.amber;
  return colors.red;
}

/** Speaking rate: healthy band 40–75, acceptable 25–85, else off */
export function speakingRateColor(pct: number): string {
  if (pct >= 40 && pct <= 75) return colors.green;
  if (pct >= 25 && pct <= 85) return colors.amber;
  return colors.red;
}

/** Agenda adherence: green ≥ 70 · amber 50–69 · red < 50 */
export function agendaColor(pct: number): string {
  if (pct >= 70) return colors.green;
  if (pct >= 50) return colors.amber;
  return colors.red;
}

// ── Alert severity ────────────────────────────────────────────────────────────

interface AlertStyle { bg: string; border: string; accent: string; }

export function alertSeverityStyle(severity: string): AlertStyle {
  switch (severity.toUpperCase()) {
    case 'HIGH':   return { bg: colors.redBg,   border: colors.red,   accent: colors.red };
    case 'MEDIUM': return { bg: colors.amberBg, border: colors.amber, accent: colors.amber };
    default:       return { bg: colors.greenBg, border: colors.green, accent: colors.green };
  }
}
