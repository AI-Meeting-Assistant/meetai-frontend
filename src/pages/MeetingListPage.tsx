import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateMeetingModal } from '../components/meetings/CreateMeetingModal';
import { MeetingCard } from '../components/meetings/MeetingCard';
import { UploadMeetingModal } from '../components/meetings/UploadMeetingModal';
import { useAuth } from '../contexts/AuthContext';
import { useRecordedProcessingEvents } from '../hooks/useRecordedProcessingEvents';
import * as meetingService from '../services/meeting.service';
import type { Meeting, PaginatedResponse } from '../types';

const LIMIT = 10;

export function MeetingListPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [result, setResult] = useState<PaginatedResponse<Meeting> | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadMeetings = useCallback(async (p = page) => {
    const data = await meetingService.listMeetings({
      page: p,
      limit: LIMIT,
      status: status || undefined,
      meetingType: meetingType || undefined,
    });
    setResult(data);
  }, [page, status, meetingType]);

  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings]);

  useRecordedProcessingEvents(result?.items ?? [], token, () => void loadMeetings());

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleCreate = async (title: string, agenda?: string, timelineResolutionMs?: number) => {
    await meetingService.createMeeting({ title, agenda, timelineResolutionMs, meetingType: 'LIVE' });
    await loadMeetings();
  };

  const handleMeetingClick = (meeting: Meeting) => {
    if (meeting.meetingType === 'RECORDED' && meeting.status === 'IN_PROGRESS') return;
    if (meeting.status === 'IN_PROGRESS' && meeting.meetingType !== 'RECORDED' && user?.role === 'MODERATOR') {
      navigate(`/meetings/${meeting.id}/live`);
      return;
    }
    navigate(`/meetings/${meeting.id}/analysis`);
  };

  const displayed = (result?.items ?? []).filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = result?.totalPages ?? 1;

  return (
    <main className="page">
      <div className="page-header">
        <h1 style={{ margin: 0 }}>Meetings</h1>
        {user?.role === 'MODERATOR' && (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(true)}>
              Upload Meeting
            </button>
            <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
              New Meeting
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', minWidth: 0 }}
        />
        <select value={status} onChange={handleFilterChange(setStatus)}>
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select value={meetingType} onChange={handleFilterChange(setMeetingType)}>
          <option value="">All Types</option>
          <option value="LIVE">Live</option>
          <option value="RECORDED">Recorded</option>
        </select>
      </div>

      {displayed.length === 0 ? (
        <p className="empty-state">No meetings found.</p>
      ) : (
        <div className="meeting-list">
          {displayed.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onClick={handleMeetingClick} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 'var(--text-sm)' }}>Page {page} of {totalPages}</span>
          <button
            type="button"
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {showModal && (
        <CreateMeetingModal onCreate={handleCreate} onClose={() => setShowModal(false)} />
      )}

      {showUploadModal && (
        <UploadMeetingModal
          onSuccess={() => void loadMeetings()}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </main>
  );
}
