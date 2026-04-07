import { useState } from 'react';

interface MCPServer {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: string[];
  lastPing: string;
  version: string;
}

export function MCPPage() {
  const [servers] = useState<MCPServer[]>([
    {
      id: '1',
      name: 'filesystem',
      description: 'Access local and remote file systems for reading, writing, and searching files',
      status: 'connected',
      tools: ['read_file', 'write_file', 'list_directory', 'search_files'],
      lastPing: '2s ago',
      version: '1.2.0',
    },
    {
      id: '2',
      name: 'memory',
      description: 'Persistent knowledge graph for storing and retrieving contextual information',
      status: 'connected',
      tools: ['save_note', 'search_notes', 'get_context', 'update_knowledge'],
      lastPing: '5s ago',
      version: '2.0.1',
    },
    {
      id: '3',
      name: 'slack',
      description: 'Send and receive messages through Slack channels and direct messages',
      status: 'disconnected',
      tools: ['send_message', 'list_channels', 'get_messages'],
      lastPing: '2h ago',
      version: '0.9.4',
    },
  ]);

  const [expandedServer, setExpandedServer] = useState<string | null>(null);

  const statusConfig = {
    connected: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', label: 'Connected' },
    disconnected: { color: 'var(--c4)', bg: 'rgba(181, 131, 141, 0.1)', label: 'Disconnected' },
    error: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Error' },
  };

  const totalTools = servers.reduce((acc, s) => acc + s.tools.length, 0);
  const connectedCount = servers.filter(s => s.status === 'connected').length;

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">MCP SERVERS</h1>
            <p className="ch-desc">Model Context Protocol — manage server connections and tool access</p>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: '24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', border: '4px solid var(--ink)', marginBottom: '24px' }}>
          <div style={{ padding: '20px', borderRight: '2px solid var(--ink)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>Servers</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '44px', lineHeight: '1', color: 'var(--c5)' }}>{servers.length}</div>
          </div>
          <div style={{ padding: '20px', borderRight: '2px solid var(--ink)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>Connected</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '44px', lineHeight: '1', color: '#4ade80' }}>{connectedCount}</div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>Total Tools</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '44px', lineHeight: '1', color: 'var(--c3)' }}>{totalTools}</div>
          </div>
        </div>

        {/* Server List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {servers.map((server) => {
            const isExpanded = expandedServer === server.id;
            const status = statusConfig[server.status];

            return (
              <div key={server.id} style={{
                border: `3px solid var(--ink)`,
                background: isExpanded ? 'var(--c1)' : 'var(--paper)',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}>
                <div
                  onClick={() => setExpandedServer(isExpanded ? null : server.id)}
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: status.color,
                    border: '3px solid var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}>
                    {server.status === 'connected' ? '✓' : server.status === 'error' ? '✕' : '○'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>{server.name}</span>
                      <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '9px',
                        padding: '3px 8px',
                        background: status.bg,
                        border: '1.5px solid var(--ink)',
                        color: status.color,
                        fontWeight: 700,
                      }}>{status.label}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--c5)', marginTop: '4px' }}>{server.description}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)' }}>v{server.version}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)' }}>Last ping: {server.lastPing}</div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '16px',
                    color: 'var(--c5)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}>▶</span>
                </div>

                {isExpanded && (
                  <div style={{
                    padding: '16px 24px 20px',
                    borderTop: '2px solid var(--ink)',
                    background: 'var(--paper)',
                  }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)', marginBottom: '12px' }}>
                      Available Tools ({server.tools.length})
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {server.tools.map((tool) => (
                        <span key={tool} style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '11px',
                          padding: '6px 12px',
                          background: 'var(--c2)',
                          border: '2px solid var(--ink)',
                          fontWeight: 700,
                        }}>{tool}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{
                        padding: '8px 16px',
                        background: server.status === 'connected' ? 'var(--c5)' : 'var(--c3)',
                        color: server.status === 'connected' ? 'var(--c1)' : 'var(--ink)',
                        border: '2px solid var(--ink)',
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                        {server.status === 'connected' ? 'RESTART' : 'CONNECT'}
                      </button>
                      <button style={{
                        padding: '8px 16px',
                        background: 'var(--paper)',
                        border: '2px solid var(--ink)',
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}>
                        CONFIGURE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Server */}
        <div style={{
          marginTop: '24px',
          border: '3px dashed var(--c4)',
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: '24px', color: 'var(--c5)', marginBottom: '8px' }}>+ ADD MCP SERVER</div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>
            Connect a new server to extend Petal's capabilities
          </p>
        </div>
      </div>
    </>
  );
}

export default MCPPage;