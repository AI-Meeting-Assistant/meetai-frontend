import { useState, useEffect, useCallback } from 'react';
import * as meetingService from '../services/meeting.service';
import type { MeetingAnalysis } from '../types';

export function useMeetingDetails(id: string | null) {
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await meetingService.getMeetingAnalysis(id);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to fetch meeting details:', err);
      setError('Failed to load meeting details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { 
    analysis, 
    meeting: analysis?.meeting ?? null, 
    isLoading, 
    error, 
    refresh: fetchDetails 
  };
}
