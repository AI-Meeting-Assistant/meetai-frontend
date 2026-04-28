export function AgendaPanel({agenda}: {agenda: string | null}){
    return (
    <section className="panel">
      <div className="panel-header">
        <h3>Agenda</h3>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--text-sm)'}}>
        {agenda ?? 'No agenda provided for this meeting.'}
      </p>
    </section>
  );
}