import { useState } from 'react';

interface ExportButtonProps {
  meetingTitle?: string;
}

export function ExportButton({ meetingTitle }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const isElectron = Boolean(window.meetai?.exportPdf);

  const handleExport = async () => {
    if (!window.meetai?.exportPdf) return;

    setIsExporting(true);
    try {
      const suggestedName = meetingTitle
        ? `${meetingTitle} - Analysis Report`
        : 'MeetAI_Report';

      const result = await window.meetai.exportPdf({ suggestedName });

      if (!result.success && result.error && result.error !== 'cancelled') {
        window.dispatchEvent(new CustomEvent('api:error', { detail: result.error }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF export failed';
      window.dispatchEvent(new CustomEvent('api:error', { detail: message }));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={!isElectron || isExporting}
      onClick={handleExport}
      title={!isElectron ? 'PDF export is only available in the desktop app' : undefined}
    >
      {isExporting ? 'Exporting…' : 'Export PDF'}
    </button>
  );
}
