import { useState } from 'react';

interface ActivityItem {
  id: string;
  agent: string;
  action: string;
  time: string;
  type: 'task' | 'calendar' | 'note' | 'system';
  details?: string;
}

export function ActivityPage() {
  const [filter, setFilter] = useState<string>('all');
  const [activities] = useState<ActivityItem[]>([
    { id: '1', agent: 'TaskAgent', action: 'Created task "Review PR #42"', time: '2m ago', type: 'task', details: 'Priority: High • Due: Tomorrow' },
    { id: '2', agent: 'CalAgent', action: 'Scheduled "Team Standup"', time: '15m ago', type: 'calendar', details: '10:00 AM • Zoom • Recurring' },
    { id: '3', agent: 'InfoAgent', action: 'Saved note "Q2 Planning Ideas"', time: '1h ago', type: 'note', details: '12 items • 3 tags' },
    { id: '4', agent: 'Orchestrator', action: 'Routed request to TaskAgent', time: '1h ago', type: 'system', details: 'Confidence: 98%' },
    { id: '5', agent: 'TaskAgent', action: 'Completed "Setup CI/CD pipeline"', time: '2h ago', type: 'task', details: 'Duration: 45m' },
    { id: '6', agent: 'CalAgent', action: 'Updated calendar sync', time: '3h ago', type: 'calendar', details: '3 events synced' },
    { id: '7', agent: 'InfoAgent', action: 'Indexed 15 new notes', time: '4h ago', type: 'note', details: 'Knowledge graph updated' },
    { id: '8', agent: 'TaskAgent', action: 'Created task "Update documentation"', time: '5h ago', type: 'task', details: 'Priority: Medium • Due: Friday' },
    { id: '9', agent: 'Orchestrator', action: 'Multi-agent collaboration', time: '6h ago', type: 'system', details: 'TaskAgent + CalAgent + InfoAgent' },
    { id: '10', agent: 'CalAgent', action: 'Created "Design Review"', time: '7h ago', type: 'calendar', details: '1:00 PM • Conference Room A' },
    { id: '11', agent: 'InfoAgent', action: 'Updated knowledge graph', time: '8h ago', type: 'note', details: '47 connections updated' },
    { id: '12', agent: 'TaskAgent', action: 'Moved "Fix login bug" to Done', time: '9h ago', type: 'task', details: 'Completed in 2h 15m' },
  ]);

  const typeColors: Record<string, string> = {
    task: 'var(--c3)',
    calendar: 'var(--c4)',
    note: 'var(--c2)',
    system: 'var(--c5)',
  };

  const typeIcons: Record<string, string> = {
    task: '✓',
    calendar: '📅',
    note: '📝',
    system: '⚡',
  };

  const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter);

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">ACTIVITY</h1>
            <p className="ch-desc">Complete log of all agent actions and system events</p>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: '24px' }}>
        {/* Filter */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', border: '3px solid var(--ink)', overflow: 'hidden' }}>
          {[
            { key: 'all', label: 'All', count: activities.length },
            { key: 'task', label: 'Tasks', count: activities.filter(a => a.type === 'task').length },
            { key: 'calendar', label: 'Calendar', count: activities.filter(a => a.type === 'calendar').length },
            { key: 'note', label: 'Notes', count: activities.filter(a => a.type === 'note').length },
            { key: 'system', label: 'System', count: activities.filter(a => a.type === 'system').length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '10px 20px',
                background: filter === f.key ? 'var(--c5)' : 'var(--paper)',
                color: filter === f.key ? 'var(--c1)' : 'var(--ink)',
                border: 'none',
                borderRight: '2px solid var(--ink)',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {f.label}
              <span style={{
                padding: '1px 6px',
                background: filter === f.key ? 'var(--c3)' : 'var(--mid)',
                border: '1.5px solid var(--ink)',
                fontSize: '9px',
              }}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* Activity List */}
        <div style={{ border: '4px solid var(--ink)' }}>
          {filtered.map((activity, i) => (
            <div key={activity.id} style={{
              display: 'flex',
              gap: '16px',
              padding: '16px 20px',
              borderBottom: i < filtered.length - 1 ? '2px solid rgba(0,0,0,0.08)' : 'none',
              alignItems: 'flex-start',
              transition: 'background 0.15s',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: typeColors[activity.type],
                border: '3px solid var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}>
                {typeIcons[activity.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{activity.action}</span>
                </div>
                {activity.details && (
                  <p style={{ fontSize: '12px', color: 'var(--c5)', marginTop: '2px' }}>{activity.details}</p>
                )}
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', marginTop: '6px' }}>
                  {activity.agent} • {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default ActivityPage;