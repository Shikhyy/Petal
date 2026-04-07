import { useState } from 'react';

interface Connection {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive' | 'pending';
  category: string;
  connectedAt?: string;
  features: string[];
}

export function ConnectionsPage() {
  const [connections] = useState<Connection[]>([
    {
      id: '1',
      name: 'Google Calendar',
      description: 'Sync events, create meetings, manage availability',
      icon: '📅',
      status: 'active',
      category: 'Calendar',
      connectedAt: '2 days ago',
      features: ['Event creation', 'Availability sync', 'Reminders'],
    },
    {
      id: '2',
      name: 'GitHub',
      description: 'Link issues, PRs, and commits to tasks',
      icon: '🐙',
      status: 'active',
      category: 'Development',
      connectedAt: '5 days ago',
      features: ['Issue tracking', 'PR notifications', 'Commit linking'],
    },
    {
      id: '3',
      name: 'Notion',
      description: 'Import and sync notes, databases, and pages',
      icon: '📋',
      status: 'inactive',
      category: 'Knowledge',
      features: ['Note import', 'Database sync', 'Page creation'],
    },
    {
      id: '4',
      name: 'Slack',
      description: 'Send notifications, create channels, manage messages',
      icon: '💬',
      status: 'inactive',
      category: 'Communication',
      features: ['Message sending', 'Channel management', 'Notifications'],
    },
    {
      id: '5',
      name: 'Google Drive',
      description: 'Access files, create documents, search content',
      icon: '📁',
      status: 'pending',
      category: 'Storage',
      features: ['File access', 'Document creation', 'Content search'],
    },
    {
      id: '6',
      name: 'Linear',
      description: 'Sync issues, track progress, manage sprints',
      icon: '🔷',
      status: 'inactive',
      category: 'Project Management',
      features: ['Issue sync', 'Sprint tracking', 'Status updates'],
    },
  ]);

  const [filter, setFilter] = useState<string>('all');
  const categories = ['all', ...new Set(connections.map(c => c.category))];

  const filtered = filter === 'all' ? connections : connections.filter(c => c.category === filter);

  const statusConfig = {
    active: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', label: 'Active' },
    inactive: { color: 'var(--c4)', bg: 'rgba(181, 131, 141, 0.15)', label: 'Inactive' },
    pending: { color: 'var(--c2)', bg: 'rgba(255, 180, 162, 0.15)', label: 'Pending' },
  };

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">CONNECTIONS</h1>
            <p className="ch-desc">Integrate with your favorite tools and services</p>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: '24px' }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', border: '3px solid var(--ink)', overflow: 'hidden' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '10px 20px',
                background: filter === cat ? 'var(--c5)' : 'var(--paper)',
                color: filter === cat ? 'var(--c1)' : 'var(--ink)',
                border: 'none',
                borderRight: '2px solid var(--ink)',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Connection Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {filtered.map((conn) => {
            const status = statusConfig[conn.status];
            return (
              <div key={conn.id} style={{
                border: '3px solid var(--ink)',
                background: 'var(--paper)',
                padding: '24px',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'var(--c2)',
                    border: '3px solid var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0,
                  }}>
                    {conn.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700 }}>{conn.name}</span>
                      <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '9px',
                        padding: '2px 6px',
                        background: status.bg,
                        border: '1.5px solid var(--ink)',
                        color: status.color,
                        fontWeight: 700,
                      }}>{status.label}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--c5)' }}>{conn.description}</p>
                    {conn.connectedAt && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', marginTop: '4px', display: 'block' }}>
                        Connected {conn.connectedAt}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {conn.features.map(f => (
                    <span key={f} style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '9px',
                      padding: '3px 8px',
                      background: 'var(--mid)',
                      border: '1.5px solid var(--ink)',
                    }}>{f}</span>
                  ))}
                </div>

                <button style={{
                  width: '100%',
                  padding: '10px',
                  background: conn.status === 'active' ? 'var(--c5)' : 'var(--c3)',
                  color: conn.status === 'active' ? 'var(--c1)' : 'var(--ink)',
                  border: '2px solid var(--ink)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  {conn.status === 'active' ? 'MANAGE' : conn.status === 'pending' ? 'APPROVE' : 'CONNECT'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default ConnectionsPage;