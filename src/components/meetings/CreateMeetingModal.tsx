import { useState } from 'react';

interface CreateMeetingModalProps {
  onCreate: (title: string, agenda: string) => Promise<void>;
}

export function CreateMeetingModal({ onCreate }: CreateMeetingModalProps) {
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onCreate(title, agenda);
      }}
    >
      <h3>New Meeting</h3>
      <input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
      <textarea placeholder="Agenda" value={agenda} onChange={(event) => setAgenda(event.target.value)} />
      <button type="submit">Create</button>
    </form>
  );
}
