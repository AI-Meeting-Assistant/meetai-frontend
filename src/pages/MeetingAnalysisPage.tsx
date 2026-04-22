import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AiSummaryPanel } from '../components/analysis/AiSummaryPanel';
import { AlertsLog } from '../components/analysis/AlertsLog';
import { ExportButton } from '../components/analysis/ExportButton';
import { TimelineViewer } from '../components/analysis/TimelineViewer';
import * as meetingService from '../services/meeting.service';
import type { MeetingAnalysis } from '../types';

export function MeetingAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    void meetingService.getMeetingAnalysis(id).then(setAnalysis);
  }, [id]);

  if (!analysis) {
    return <div>Loading analysis...</div>;
  }

  return (
    <main>
      <h1>{analysis.meeting.title}</h1>
      <TimelineViewer entries={analysis.timeline} />
      <AlertsLog alerts={analysis.alerts} />
      <AiSummaryPanel summary={analysis.aiSummary} />
      <ExportButton />
    </main>
  );
}
