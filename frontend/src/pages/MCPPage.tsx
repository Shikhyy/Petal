import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage, getMcpStatus, type MCPServiceStatus } from '../utils/api';
import { AppIcon } from '../components/AppIcon';
import { Skeleton, SkeletonText } from '../components/Skeleton';

const toolHints: Record<string, string[]> = {
  google_calendar: ['health', 'create_event', 'list_events', 'delete_event', 'find_free_slots'],
  gmail: ['health', 'send_email', 'list_emails'],
  notes: ['health', 'save_note', 'list_notes', 'search_notes'],
};

const descriptions: Record<string, string> = {
  google_calendar: 'Calendar sync and event management via MCP.',
  gmail: 'Email operations and inbox automation via MCP.',
  notes: 'Notes knowledge operations via MCP (optional; local fallback supported).',
};

export function MCPPage() {
  const [services, setServices] = useState<MCPServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (!services.length) setLoading(true);
      setError(null);
      const data = await getMcpStatus();
      setServices(data.services);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load MCP status.'));
    } finally {
      setLoading(false);
    }
  }, [services.length]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => ({
    total: services.length,
    connected: services.filter((service) => service.status === 'connected').length,
    configured: services.filter((service) => service.configured).length,
  }), [services]);

  const statusConfig = {
    connected: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', label: 'Connected' },
    error: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Error' },
    not_configured: { color: 'var(--c4)', bg: 'rgba(181, 131, 141, 0.1)', label: 'Not Configured' },
    unknown: { color: 'var(--c2)', bg: 'rgba(255, 180, 162, 0.12)', label: 'Checking' },
  };

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">MCP SERVERS</h1>
            <p className="ch-desc">Live MCP health and capability status from the backend</p>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0', border: '4px solid var(--ink)', marginBottom: '24px' }}>
          <div style={{ padding: '20px', borderRight: '2px solid var(--ink)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>Services</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '44px', lineHeight: '1', color: 'var(--c5)' }}>{summary.total}</div>
          </div>
          <div style={{ padding: '20px', borderRight: '2px solid var(--ink)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>Configured</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '44px', lineHeight: '1', color: '#4ade80' }}>{summary.configured}</div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>Connected</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '44px', lineHeight: '1', color: 'var(--c3)' }}>{summary.connected}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)', margin: 0 }}>This page reflects backend MCP URLs and health probes, not mocked local state.</p>
          <button
            type="button"
            onClick={() => void load()}
            style={{
              padding: '9px 12px',
              background: 'var(--c3)',
              border: '2px solid var(--ink)',
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '1px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Refresh
          </button>
        </div>

        {loading && !services.length && (
          <div style={{ display: 'grid', gap: 14 }}>
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} style={{ border: '3px solid var(--ink)', background: 'var(--paper)', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Skeleton width={48} height={48} radius={4} />
                  <div style={{ flex: 1 }}>
                    <Skeleton height={14} width="34%" radius={999} style={{ marginBottom: 8 }} />
                    <SkeletonText lines={2} widths={["88%", "62%"]} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ border: '2px solid var(--ink)', padding: '14px', fontFamily: 'var(--mono)', fontSize: '11px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Server List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {services.map((service) => {
            const status = statusConfig[service.status];

            return (
              <div key={service.name} style={{
                border: `3px solid var(--ink)`,
                background: 'var(--paper)',
                transition: 'all 0.2s',
              }}>
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: status.color,
                    border: '3px solid var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink)',
                  }}>
                    <AppIcon name={service.status === 'connected' ? 'task' : service.status === 'error' ? 'help' : 'spark'} size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>{service.name}</span>
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
                    <p style={{ fontSize: '12px', color: 'var(--c5)', marginTop: '4px' }}>{descriptions[service.name] || 'MCP service connection status.'}</p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', marginTop: '4px' }}>
                      {service.url ? `URL: ${service.url}` : 'URL: not configured'}
                    </p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: service.status === 'error' ? '#991b1b' : 'var(--c5)', marginTop: '4px' }}>
                      {service.message}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)' }}>{service.configured ? 'Configured' : 'Unconfigured'}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)' }}>Last check: {new Date(service.last_checked).toLocaleTimeString()}</div>
                  </div>
                </div>

                <div style={{ padding: '0 24px 20px', borderTop: '2px solid var(--ink)', background: 'var(--paper)' }}>
                  <div style={{ margin: '14px 0 10px', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>
                    Available Tools ({toolHints[service.name]?.length || 0})
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(toolHints[service.name] || ['health']).map((tool) => (
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
                </div>
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
          <div style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', margin: '0 auto 8px', color: 'var(--c5)' }}>
            <AppIcon name="mcp" size={24} />
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: '24px', color: 'var(--c5)', marginBottom: '8px' }}>ADD MCP SERVER</div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>
            Connect a new server to extend Petal's capabilities
          </p>
        </div>
      </div>
    </>
  );
}

export default MCPPage;