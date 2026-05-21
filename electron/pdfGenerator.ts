import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PdfReportData {
  meetingTitle: string;
  meetingDate: string;
  meetingType: 'LIVE' | 'RECORDED';
  theme: 'light' | 'dark';
  agenda: string | null;
  aiSummary: string | null;
  focusPercent: number;
  speakingPercent: number;
  agendaPercent: number;
  focusTimeline: Array<{ x: number; y: number }>;
  speakingTimeline: Array<{ x: number; y: number }>;
  agendaTimeline: Array<{ x: number; y: number }>;
  speakers: Array<{ label: string; ms: number; percent: number }>;
  participants: Array<{
    label: string;
    talkPercent: number;
    talkMs: number;
    avgFocusPercent: number | null;
  }>;
  transcriptLines: Array<{
    speaker: string;
    startMs: number;
    endMs: number;
    text: string;
  }>;
  fullTranscript: string | null;
  alerts: Array<{
    severity: string;
    eventType: string;
    message: string;
    time: string;
  }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtMs(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function fmtTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  return `${(s / 60).toFixed(1)} min`;
}

function simpleMarkdown(md: string): string {
  let html = esc(md);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*<(h[234]|ul)/g, '<$1');
  html = html.replace(/<\/(h[234]|ul)>\s*<\/p>/g, '</$1>');
  return html;
}

// ── SVG Builders ─────────────────────────────────────────────────────────────

function buildDonutRing(value: number, color: string, size: number): string {
  const sw = 8;
  const r = (size - sw * 2) / 2;
  const cir = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const off = cir * (1 - clamped / 100);
  const cx = size / 2;
  return `
    <div class="donut-wrap" style="width:${size}px;height:${size}px;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg);display:block;">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${sw}"/>
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"
          stroke-dasharray="${cir}" stroke-dashoffset="${off}" stroke-linecap="round"/>
      </svg>
      <div class="donut-label">${Math.round(clamped)}%</div>
    </div>`;
}

function buildLineChart(data: Array<{ x: number; y: number }>, color: string, title: string, avg: number | null): string {
  const W = 700, H = 140;
  const PAD = { t: 10, r: 12, b: 28, l: 38 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const yMax = 100;
  const yTicks = [0, 25, 50, 75, 100];

  const hasData = data.length >= 2;
  const sorted = [...data].sort((a, b) => a.x - b.x);
  const minX = hasData ? sorted[0].x : 0;
  const maxX = hasData ? sorted[sorted.length - 1].x : 1;
  const tx = (x: number) => ((x - minX) / (maxX - minX || 1)) * cW + PAD.l;
  const ty = (y: number) => cH - (Math.max(0, Math.min(yMax, y)) / yMax) * cH + PAD.t;

  let gridLines = '';
  for (const v of yTicks) {
    gridLines += `<line x1="${PAD.l}" y1="${ty(v)}" x2="${PAD.l + cW}" y2="${ty(v)}" stroke="var(--border-subtle)" stroke-width="0.5" stroke-dasharray="3,4"/>`;
    gridLines += `<text x="${PAD.l - 6}" y="${ty(v)}" text-anchor="end" dominant-baseline="middle" style="font-size:10px;fill:var(--tx-3);font-family:var(--font-mono)">${v}</text>`;
  }

  let dataSvg = '';
  if (hasData) {
    const pts = sorted.map(d => `${tx(d.x)},${ty(d.y)}`).join(' ');
    const area = `${PAD.l},${PAD.t + cH} ${pts} ${tx(maxX)},${PAD.t + cH}`;
    dataSvg += `<polygon points="${area}" fill="${color}" opacity="0.07"/>`;
    dataSvg += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    for (const d of sorted) {
      dataSvg += `<circle cx="${tx(d.x)}" cy="${ty(d.y)}" r="2.5" fill="var(--bg-card)" stroke="${color}" stroke-width="1.5"/>`;
    }
  }

  const avgLabel = avg != null && avg > 0 ? `<span class="chart-avg" style="color:${color}">avg ${Math.round(avg)}%</span>` : '';

  return `
    <div class="report-card line-chart-card">
      <div class="chart-header"><span class="chart-title">${esc(title)}</span>${avgLabel}</div>
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;font-family:var(--font-mono)">
        ${gridLines}${dataSvg}
        <text x="${PAD.l}" y="${H - 5}" style="font-size:10px;fill:var(--tx-3);font-family:var(--font-mono)">${fmtMs(minX)}</text>
        ${hasData ? `<text x="${PAD.l + cW}" y="${H - 5}" text-anchor="end" style="font-size:10px;fill:var(--tx-3);font-family:var(--font-mono)">${fmtMs(maxX)}</text>` : ''}
      </svg>
      ${!hasData ? '<div class="empty-label">No data available.</div>' : ''}
    </div>`;
}

// ── HTML Template ────────────────────────────────────────────────────────────

function buildReportHtml(data: PdfReportData): string {
  const isDark = data.theme === 'dark';
  const dateStr = data.meetingDate
    ? new Date(data.meetingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  // Colors (hardcoded to avoid CSS var resolution issues in headless Chromium)
  const C = isDark ? {
    bg: '#2d2f3a', bgCard: 'rgba(60,63,78,0.65)', bgSubtle: 'rgba(53,56,69,0.7)',
    border: 'rgba(80,84,98,0.6)', borderSubtle: 'rgba(68,71,83,0.5)',
    tx1: '#f0f0f4', tx2: '#a8aabd', tx3: '#7b7e91',
    accent: '#6b7bff', green: '#5ec882', amber: '#c8a03a', red: '#e06060',
    purple: '#a87be0', accentSubtle: 'rgba(60,60,120,0.5)',
    greenBg: 'rgba(50,80,60,0.4)', amberBg: 'rgba(80,70,40,0.4)', redBg: 'rgba(80,50,50,0.4)',
  } : {
    bg: '#f2f3f8', bgCard: '#ffffff', bgSubtle: '#ecedf3',
    border: '#d4d6e0', borderSubtle: '#e5e6ed',
    tx1: '#1a1c2e', tx2: '#5c5f70', tx3: '#8a8d9e',
    accent: '#4a5adf', green: '#2e9e5a', amber: '#b08a20', red: '#c04040',
    purple: '#7a4ac0', accentSubtle: '#ededfa',
    greenBg: '#e8f7ee', amberBg: '#faf3e0', redBg: '#fce8e8',
  };

  const metricFocus = C.purple;
  const metricSpeaking = C.accent;
  const metricAgenda = C.green;

  // Severity color helper
  const sevColor = (s: string) => {
    switch (s.toUpperCase()) {
      case 'HIGH': return { bg: C.redBg, border: C.red, accent: C.red };
      case 'MEDIUM': return { bg: C.amberBg, border: C.amber, accent: C.amber };
      default: return { bg: C.greenBg, border: C.green, accent: C.green };
    }
  };

  // Event type labels
  const eventLabel = (t: string) => {
    const map: Record<string, string> = {
      FOCUS_DROP: 'Focus Level Dropped', FOCUS_RECOVERED: 'Focus Level Recovered',
      SPEAKING_RATE_DROP: 'Speaking Rate Dropped', SPEAKING_RATE_RECOVERED: 'Speaking Rate Recovered',
      AGENDA_DEVIATION: 'Agenda Deviation Detected', AGENDA_FIT: 'Agenda On Track',
    };
    return map[t] ?? t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  // ── Build sections ──

  // KPI row
  const kpiRow = `
    <div class="kpi-row">
      <div class="kpi-card">
        ${buildDonutRing(data.focusPercent, metricFocus, 96)}
        <div class="kpi-info"><div class="kpi-label">Avg. Focus</div><div class="kpi-sub">Across all participants</div></div>
      </div>
      <div class="kpi-card">
        ${buildDonutRing(data.speakingPercent, metricSpeaking, 96)}
        <div class="kpi-info"><div class="kpi-label">Speaking Activity</div><div class="kpi-sub">Active speaking fraction</div></div>
      </div>
      <div class="kpi-card">
        ${buildDonutRing(data.agendaPercent, metricAgenda, 96)}
        <div class="kpi-info"><div class="kpi-label">Agenda Adherence</div><div class="kpi-sub">On-topic score</div></div>
      </div>
    </div>`;

  // Agenda
  const agendaSection = data.agenda ? `
    <div class="report-card no-break">
      <div class="section-title">Agenda</div>
      <p class="body-text">${esc(data.agenda)}</p>
    </div>` : '';

  // AI Summary
  const summarySection = data.aiSummary ? `
    <div class="report-card no-break">
      <div class="section-title">AI Summary</div>
      <div class="summary-body">${simpleMarkdown(data.aiSummary)}</div>
    </div>` : '';

  // Speaker time
  let speakerSection = '';
  if (data.speakers.length > 0) {
    const bars = data.speakers.map(s => `
      <div class="speaker-row">
        <div class="speaker-meta">
          <span class="speaker-name">${esc(s.label)}</span>
          <span class="speaker-stat">${fmtTime(s.ms)} (${s.percent.toFixed(1)}%)</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${s.percent}%;background:${metricSpeaking}"></div></div>
      </div>`).join('');
    speakerSection = `<div class="report-card no-break"><div class="section-title">Speaker Time</div>${bars}</div>`;
  }

  // Participant stats
  let participantSection = '';
  if (data.participants.length > 0) {
    const rows = data.participants.map(p => `
      <div class="participant-row no-break">
        <div class="participant-name">${esc(p.label)}</div>
        <div class="participant-metric">
          <span class="metric-label">Talk</span>
          <span class="metric-value">${Math.round(p.talkPercent)}% · ${fmtTime(p.talkMs)}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, p.talkPercent)}%;background:${metricSpeaking}"></div></div>
        <div class="participant-metric">
          <span class="metric-label">Focus</span>
          <span class="metric-value">${p.avgFocusPercent !== null ? Math.round(p.avgFocusPercent) + '%' : '–'}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${p.avgFocusPercent ?? 0}%;background:${metricFocus}"></div></div>
      </div>`).join('');
    participantSection = `<div class="report-card"><div class="section-title">Participants</div>${rows}</div>`;
  }

  // Line charts
  const focusChart = buildLineChart(data.focusTimeline, metricFocus, 'Focus Level', data.focusPercent > 0 ? data.focusPercent : null);
  const speakingChart = buildLineChart(data.speakingTimeline, metricSpeaking, 'Speaking Activity', data.speakingPercent > 0 ? data.speakingPercent : null);
  const agendaChart = buildLineChart(data.agendaTimeline, metricAgenda, 'Agenda Adherence', data.agendaPercent > 0 ? data.agendaPercent : null);

  // Alerts
  let alertsSection = '';
  if (data.alerts.length > 0) {
    const items = data.alerts.map(a => {
      const sc = sevColor(a.severity);
      return `
        <div class="alert-item no-break" style="background:${sc.bg};border-color:${sc.border};border-left-color:${sc.accent};">
          <div class="alert-type" style="color:${sc.accent}">${esc(eventLabel(a.eventType))}</div>
          ${a.message ? `<div class="alert-msg">${esc(a.message)}</div>` : ''}
          <div class="alert-meta">${esc(a.severity)} · ${esc(a.time)}</div>
        </div>`;
    }).join('');
    alertsSection = `<div class="report-card"><div class="section-title">Alerts Log <span class="count">${data.alerts.length} total</span></div>${items}</div>`;
  }

  // Transcript
  let transcriptSection = '';
  if (data.transcriptLines.length > 0) {
    const lines = data.transcriptLines.map(l => `
      <div class="transcript-line no-break">
        <div class="transcript-speaker">${esc(l.speaker)}${l.startMs > 0 ? ` · ${fmtMs(l.startMs)}` : ''}</div>
        <p class="transcript-text">${esc(l.text)}</p>
      </div>`).join('');
    transcriptSection = `<div style="margin-top: 16px;"><div class="section-title">Transcript</div>${lines}</div>`;
  } else if (data.fullTranscript) {
    transcriptSection = `<div style="margin-top: 16px;"><div class="section-title">Transcript</div><p class="body-text" style="white-space:pre-wrap">${esc(data.fullTranscript)}</p></div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${esc(data.meetingTitle)} — MeetAI Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
:root {
  --font-sans: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'DM Mono', monospace;
  --bg: ${C.bg}; --bg-card: ${C.bgCard}; --bg-subtle: ${C.bgSubtle};
  --border: ${C.border}; --border-subtle: ${C.borderSubtle};
  --tx-1: ${C.tx1}; --tx-2: ${C.tx2}; --tx-3: ${C.tx3};
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { font-family: var(--font-sans); font-size: 12px; color: var(--tx-1); background: var(--bg); line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.report { max-width: 100%; }
.report-header { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid var(--border); }
.report-title { font-size: 22px; font-weight: 700; letter-spacing: -0.03em; color: var(--tx-1); margin-bottom: 4px; }
.report-meta { font-size: 11px; color: var(--tx-3); display: flex; gap: 12px; align-items: center; }
.badge { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: ${C.accentSubtle}; color: ${C.accent}; }
.report-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 16px 20px; margin-bottom: 12px; }
.no-break { page-break-inside: avoid; break-inside: avoid; }
.section-title { font-size: 13px; font-weight: 600; color: var(--tx-1); margin-bottom: 12px; }
.count { font-size: 10px; color: var(--tx-3); font-family: var(--font-mono); font-weight: 400; }
.body-text { font-size: 12px; color: var(--tx-2); line-height: 1.7; }
.kpi-row { display: flex; gap: 10px; margin-bottom: 16px; page-break-inside: avoid; break-inside: avoid; }
.kpi-card { flex: 1; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; }
.donut-wrap { position: relative; flex-shrink: 0; }
.donut-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 15px; font-weight: 600; color: var(--tx-1); }
.kpi-info { flex: 1; min-width: 0; }
.kpi-label { font-size: 10px; font-weight: 600; color: var(--tx-3); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 4px; }
.kpi-sub { font-size: 11px; color: var(--tx-3); line-height: 1.4; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.chart-title { font-size: 13px; font-weight: 600; color: var(--tx-1); }
.chart-avg { font-size: 10px; font-family: var(--font-mono); font-weight: 600; }
.line-chart-card { page-break-inside: avoid; break-inside: avoid; }
.line-chart-card svg { width: 100%; height: auto; }
.empty-label { font-size: 11px; color: var(--tx-3); font-style: italic; text-align: center; padding: 20px 0; }
.speaker-row { margin-bottom: 8px; }
.speaker-meta { display: flex; justify-content: space-between; margin-bottom: 4px; }
.speaker-name { font-size: 11px; color: var(--tx-2); font-family: var(--font-mono); font-weight: 500; }
.speaker-stat { font-size: 10px; font-family: var(--font-mono); color: var(--tx-3); }
.bar-track { height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 3px; }
.participant-row { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--border-subtle); }
.participant-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.participant-name { font-size: 12px; font-weight: 500; color: var(--tx-1); margin-bottom: 6px; }
.participant-metric { display: flex; justify-content: space-between; margin-bottom: 3px; }
.metric-label { font-size: 10px; color: var(--tx-3); }
.metric-value { font-size: 10px; font-family: var(--font-mono); color: var(--tx-2); }
.alert-item { padding: 8px 10px; border: 1px solid; border-left-width: 4px; border-radius: 6px; margin-bottom: 6px; }
.alert-type { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 3px; }
.alert-msg { font-size: 11px; color: var(--tx-1); line-height: 1.5; margin-bottom: 3px; }
.alert-meta { font-size: 9px; color: var(--tx-3); font-family: var(--font-mono); }
.transcript-line { padding: 6px 0; border-bottom: 1px solid var(--border-subtle); }
.transcript-line:last-child { border-bottom: none; }
.transcript-speaker { font-size: 10px; font-weight: 600; color: var(--tx-3); font-family: var(--font-mono); margin-bottom: 2px; letter-spacing: 0.04em; }
.transcript-text { font-size: 12px; color: var(--tx-2); line-height: 1.65; }
.summary-body { font-size: 12px; color: var(--tx-2); line-height: 1.75; }
.summary-body strong { font-weight: 600; color: var(--tx-1); }
.summary-body ul { margin: 4px 0 8px 18px; padding: 0; }
.summary-body li { margin-bottom: 3px; }
.summary-body p { margin: 0 0 8px; }
.summary-body p:last-child { margin-bottom: 0; }
.footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--border); text-align: center; font-size: 9px; color: var(--tx-3); }
</style>
</head>
<body>
<table style="width: 100%; border-collapse: collapse; border-spacing: 0;">
  <thead>
    <tr><td style="height: 16mm; padding: 0;"></td></tr>
  </thead>
  <tbody>
    <tr><td style="padding: 0 14mm;">
      <div class="report">
        <div class="report-header no-break">
          <div class="report-title">${esc(data.meetingTitle)}</div>
          <div class="report-meta">
            <span>${dateStr}</span>
            <span class="badge">${data.meetingType}</span>
          </div>
        </div>
        ${kpiRow}
        ${agendaSection}
        ${summarySection}
        ${speakerSection}
        ${participantSection}
        ${focusChart}
        ${speakingChart}
        ${agendaChart}
        ${alertsSection}
        ${transcriptSection}
        <div class="footer">Generated by MeetAI · ${dateStr}</div>
      </div>
    </td></tr>
  </tbody>
  <tfoot>
    <tr><td style="height: 16mm; padding: 0;"></td></tr>
  </tfoot>
</table>
<div id="report-ready"></div>
</body>
</html>`;
}

// ── Browser Discovery ────────────────────────────────────────────────────────

function findChromium(): string {
  const candidates: string[] = [];

  if (process.platform === 'win32') {
    const pf = process.env['PROGRAMFILES'] || 'C:\\Program Files';
    const pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const local = process.env['LOCALAPPDATA'] || '';
    candidates.push(
      path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    );
  } else {
    candidates.push(
      '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser', '/usr/bin/chromium',
      '/snap/bin/chromium',
    );
  }

  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch { /* skip */ }
  }

  throw new Error(
    'Could not find Chrome or Edge on this system. Please install Google Chrome or Microsoft Edge to use PDF export.',
  );
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function generatePdf(data: PdfReportData): Promise<Buffer> {
  const html = buildReportHtml(data);
  const executablePath = findChromium();

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#report-ready');
    // Allow fonts to finish loading
    await page.evaluateHandle(() => document.fonts.ready);
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
