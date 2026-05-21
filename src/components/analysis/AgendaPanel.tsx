export function AgendaPanel({ agenda }: { agenda: string | null }) {
  return (
    <div className="card">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 10 }}>Agenda</div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.65 }}>
        {agenda || 'No agenda provided for this meeting.'}
      </p>
    </div>
  );
}
