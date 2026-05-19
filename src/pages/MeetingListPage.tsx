import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateMeetingModal } from '../components/meetings/CreateMeetingModal';
import { MeetingCard } from '../components/meetings/MeetingCard';
import { UploadMeetingModal } from '../components/meetings/UploadMeetingModal';
import { useAuth } from '../contexts/AuthContext';
import { useRecordedProcessingEvents } from '../hooks/useRecordedProcessingEvents';
import * as meetingService from '../services/meeting.service';
import type { Meeting } from '../types';

const STATUS_PRIORITY = {
  IN_PROGRESS: 1,
  SCHEDULED: 2,
  COMPLETED: 3,
};

export function MeetingListPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadMeetings = useCallback(async () => {
    const data = await meetingService.listMeetings();
    data.sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status] || Infinity;
      const priorityB = STATUS_PRIORITY[b.status] || Infinity;
      return priorityA - priorityB;
    });
    setMeetings(data);
  }, []);

  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings]);

  useRecordedProcessingEvents(meetings, token, loadMeetings);

  const handleCreate = async (title: string, agenda?: string, timelineResolutionMs?: number) => {
    await meetingService.createMeeting({ title, agenda, timelineResolutionMs, meetingType: 'LIVE' });
    await loadMeetings();
  };

  const handleMeetingClick = (meeting: Meeting) => {
    if (meeting.meetingType === 'RECORDED' && meeting.status === 'IN_PROGRESS') {
      return;
    }
    if (meeting.status === 'IN_PROGRESS' && meeting.meetingType !== 'RECORDED' && user?.role === 'MODERATOR') {
      navigate(`/meetings/${meeting.id}/live`);
      return;
    }
    navigate(`/meetings/${meeting.id}/analysis`);
  };

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

      {meetings.length === 0 ? (
        <p className="empty-state">No meetings yet.</p>
      ) : (
        <div className="meeting-list">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onClick={handleMeetingClick} />
          ))}
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
