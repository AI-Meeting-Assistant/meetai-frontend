import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateMeetingModal } from '../components/meetings/CreateMeetingModal';
import { MeetingCard } from '../components/meetings/MeetingCard';
import { UploadMeetingModal } from '../components/meetings/UploadMeetingModal';
import { UserManagementModal } from '../components/users/UserManagementModal';
import { useAuth } from '../contexts/AuthContext';
import { useRecordedProcessingEvents } from '../hooks/useRecordedProcessingEvents';
import * as meetingService from '../services/meeting.service';
import type { Meeting, PaginatedResponse } from '../types';

const LIMIT = 10;

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

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
  const [showUsersModal, setShowUsersModal] = useState(false);

  const loadMeetings = useCallback(async (p = page) => {
    const data = await meetingService.listMeetings({
      page: p, limit: LIMIT,
      status: status || undefined,
      meetingType: meetingType || undefined,
    });
    setResult(data);
  }, [page, status, meetingType]);

  useEffect(() => { void loadMeetings(); }, [loadMeetings]);

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
    if (meeting.status === 'IN_PROGRESS' && meeting.meetingType !== 'RECORDED' && user?.role === 'MODERATOR') {
      navigate(`/meetings/${meeting.id}/live`);
      return;
    }
    navigate(`/meetings/${meeting.id}/analysis`);
  };

  const handleUploadSuccess = (meetingId: string) => {
    void loadMeetings();
    navigate(`/meetings/${meetingId}/analysis`);
  };

  const displayed = (result?.items ?? []).filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;

  return (
    <main className="page">
      {/* Viewer notice */}
      {user?.role === 'VIEWER' && (
        <div style={{
          padding: '10px 14px', background: 'var(--accent-subtle)',
          border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)',
          fontSize: 12, color: 'var(--tx-2)', marginBottom: 24,
        }}>
          Read-only access — contact your organization administrator to manage meetings.
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--tx-1)' }}>
            Meetings
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--tx-3)' }}>
            {total} total
          </p>
        </div>
        {user?.role === 'MODERATOR' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={() => setShowUsersModal(true)}>Team</button>
            <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(true)}>Upload Meeting</button>
            <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>+ New Meeting</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <div style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--tx-3)', pointerEvents: 'none',
          }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>

        {/* Status filter */}
        <select
          value={status}
          onChange={handleFilterChange(setStatus)}
          style={{ width: 'auto', flex: 'none' }}
        >
          <option value="">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        {/* Type filter */}
        <select
          value={meetingType}
          onChange={handleFilterChange(setMeetingType)}
          style={{ width: 'auto', flex: 'none' }}
        >
          <option value="">All types</option>
          <option value="LIVE">Live</option>
          <option value="RECORDED">Recorded</option>
        </select>
      </div>

      {/* Meeting list */}
      {displayed.length === 0 ? (
        <div className="empty-state">No meetings match your filters.</div>
      ) : (
        <div className="meeting-list">
          {displayed.map(meeting => (
            <MeetingCard key={meeting.id} meeting={meeting} onClick={handleMeetingClick} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, marginTop: 28,
        }}>
          <button type="button" className="btn-secondary" disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft /> Prev
          </button>
          <span style={{ fontSize: 13, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
            {page} / {totalPages}
          </span>
          <button type="button" className="btn-secondary" disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Next <ChevronRight />
          </button>
        </div>
      )}

      {/* Panels — always mounted so exit animation plays */}
      <CreateMeetingModal open={showModal} onCreate={handleCreate} onClose={() => setShowModal(false)} />
      <UploadMeetingModal open={showUploadModal} onSuccess={handleUploadSuccess} onClose={() => setShowUploadModal(false)} />
      <UserManagementModal open={showUsersModal} onClose={() => setShowUsersModal(false)} />
    </main>
  );
}
