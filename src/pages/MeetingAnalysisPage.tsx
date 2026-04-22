import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AiSummaryPanel } from '../components/analysis/AiSummaryPanel';
import { AlertsLog } from '../components/analysis/AlertsLog';
import { ExportButton } from '../components/analysis/ExportButton';
import { TimelineViewer } from '../components/analysis/TimelineViewer';
import * as meetingService from '../services/meeting.service';
import type { MeetingAnalysis } from '../types';

export function MeetingAnalysisPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);

  useEffect(() => {
    if (!id) return;
    void meetingService.getMeetingAnalysis(id).then(setAnalysis);
  }, [id]);

  if (!analysis) {
    return <div className="loading">Loading analysis…</div>;
  }

  return (
    <main className="page">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => navigate('/meetings')}
        style={{ marginBottom: 'var(--space-5)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
      >
        ← Back
      </button>
      <div className="page-header">
        <h1 style={{ margin: 0 }}>{analysis.meeting.title}</h1>
        <ExportButton />
      </div>

      <div className="analysis-full">
        <AiSummaryPanel summary={analysis.aiSummary} />
      </div>

      <div className="analysis-grid">
        <AlertsLog alerts={analysis.alerts} />
        <TimelineViewer entries={analysis.timeline} />
      </div>
    </main>
  );
}
