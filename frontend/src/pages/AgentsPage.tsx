import { useAgents } from '../hooks/useAgents';

const agentNotes = [
  {
    name: 'Orchestrator',
    description: 'Routes requests to the right specialist and falls back to general chat.',
  },
  {
    name: 'TaskAgent',
    description: 'Creates, updates, lists, and deletes tasks.',
  },
  {
    name: 'CalAgent',
    description: 'Handles meeting and calendar workflows.',
  },
  {
    name: 'InfoAgent',
    description: 'Saves, lists, and retrieves notes and knowledge.',
  },
];

export function AgentsPage() {
  const { agents } = useAgents();

  const agentMap = new Map(agents.map((agent) => [agent.name.toLowerCase(), agent]));

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">AGENTS</h1>
            <p className="ch-desc">Live status and responsibilities for the multi-agent backend</p>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
          {agentNotes.map((agent) => {
            const liveAgent = agentMap.get(agent.name.toLowerCase());
            const status = liveAgent?.status || 'idle';

            return (
              <div
                key={agent.name}
                style={{
                  border: '4px solid var(--ink)',
                  background: 'var(--paper)',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '8px' }}>{agent.description}</div>
                  </div>
                  <div
                    style={{
                      padding: '6px 10px',
                      border: '2px solid var(--ink)',
                      background: status === 'working' ? 'var(--c3)' : 'var(--mid)',
                      fontFamily: 'var(--mono)',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    {status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '24px', border: '4px solid var(--ink)' }}>
          <div style={{ background: 'var(--c5)', color: 'var(--c1)', padding: '14px 20px', borderBottom: '3px solid var(--ink)' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Live Status Snapshot
            </span>
          </div>
          <div style={{ padding: '16px 20px', fontSize: '13px' }}>
            {agents.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '8px' }}>
                {agents.map((agent) => (
                  <li key={agent.name}>
                    {agent.name} is {agent.status}
                  </li>
                ))}
              </ul>
            ) : (
              <div>No agent status received yet.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AgentsPage;