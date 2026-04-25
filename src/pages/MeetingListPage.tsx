import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateMeetingModal } from '../components/meetings/CreateMeetingModal';
import { MeetingCard } from '../components/meetings/MeetingCard';
import { useAuth } from '../contexts/AuthContext';
import * as meetingService from '../services/meeting.service';
import type { Meeting } from '../types';

export function MeetingListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showModal, setShowModal] = useState(false);

  const loadMeetings = async () => {
    const data = await meetingService.listMeetings();
    setMeetings(data);
  };

  useEffect(() => {
    void loadMeetings();
  }, []);

  const handleCreate = async (title: string, agenda?: string) => {
    await meetingService.createMeeting({ title, agenda });
    await loadMeetings();
  };

  const handleMeetingClick = (meeting: Meeting) => {
    if (meeting.status === 'IN_PROGRESS' && user?.role === 'MODERATOR') {
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
          <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
            New Meeting
          </button>
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
    </main>
  );
}
