import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage, getAgentsStatus, getMcpStatus, type MCPStatusResponse, type AgentStatus } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { Skeleton, SkeletonText } from '../components/Skeleton';

type HealthResult = { status: string; service: string; version: string };

export function DiagnosticsPage() {
  const { authenticated, loading: authLoading, user } = useAuth();
  const [backendHealth, setBackendHealth] = useState<HealthResult | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [mcp, setMcp] = useState<MCPStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(true);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [health, agentsData, mcpData] = await Promise.all([
        api.get<HealthResult>('/health'),
        getAgentsStatus(),
        getMcpStatus(),
      ]);
      setBackendHealth(health.data);
      setAgents(agentsData.agents);
      setMcp(mcpData);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load diagnostics.'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const agentCounts = useMemo(() => ({
    idle: agents.filter((agent) => agent.status === 'idle').length,
    working: agents.filter((agent) => agent.status === 'working').length,
    error: agents.filter((agent) => agent.status === 'error').length,
  }), [agents]);

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">DIAGNOSTICS</h1>
            <p className="ch-desc">Health snapshot for auth, backend, agents, and MCP integrations</p>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>
            {authLoading ? 'Checking auth session...' : authenticated ? `Signed in as ${user?.email || 'unknown user'}` : 'Not signed in'}
          </div>
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
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {refreshing && !backendHealth && !agents.length && !mcp && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} style={{ border: '3px solid var(--ink)', background: 'var(--paper)', padding: '18px' }}>
                <Skeleton height={10} width="36%" radius={999} style={{ marginBottom: 12 }} />
                <Skeleton height={34} width="48%" radius={0} style={{ marginBottom: 10 }} />
                <SkeletonText lines={2} widths={["86%", "68%"]} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ border: '2px solid var(--ink)', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '12px', marginBottom: '16px', fontFamily: 'var(--mono)', fontSize: '11px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ border: '3px solid var(--ink)', background: 'var(--paper)', padding: '18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--c5)' }}>Backend</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '34px' }}>{backendHealth?.status || 'unknown'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)' }}>{backendHealth?.service || 'n/a'} {backendHealth?.version ? `v${backendHealth.version}` : ''}</div>
          </div>
          <div style={{ border: '3px solid var(--ink)', background: 'var(--paper)', padding: '18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--c5)' }}>Agents</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '34px' }}>{agents.length}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)' }}>{agentCounts.working} working, {agentCounts.error} error, {agentCounts.idle} idle</div>
          </div>
          <div style={{ border: '3px solid var(--ink)', background: 'var(--paper)', padding: '18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--c5)' }}>MCP Services</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '34px' }}>{mcp?.summary.total ?? 0}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)' }}>{mcp?.summary.connected ?? 0} connected / {mcp?.summary.configured ?? 0} configured</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ border: '3px solid var(--ink)', background: 'var(--paper)', padding: '18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)', marginBottom: '10px' }}>Auth Status</div>
            <div style={{ fontSize: '13px' }}>{authenticated ? 'Authenticated' : 'Unauthenticated'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', marginTop: '6px' }}>{user?.email || 'No active session'}</div>
          </div>
          <div style={{ border: '3px solid var(--ink)', background: 'var(--paper)', padding: '18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)', marginBottom: '10px' }}>Backend Health</div>
            <div style={{ fontSize: '13px' }}>{backendHealth ? 'Reachable' : 'Unknown'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', marginTop: '6px' }}>{backendHealth ? `${backendHealth.service} / ${backendHealth.version}` : 'No health response yet'}</div>
          </div>
          <div style={{ border: '3px solid var(--ink)', background: 'var(--paper)', padding: '18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)', marginBottom: '10px' }}>MCP Health</div>
            <div style={{ fontSize: '13px' }}>{mcp?.summary.overall_status || 'unknown'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', marginTop: '6px' }}>{mcp ? `${mcp.summary.connected} connected` : 'No MCP snapshot yet'}</div>
          </div>
        </div>

        <div style={{ marginTop: '24px', border: '3px solid var(--ink)', background: 'var(--paper)', padding: '18px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)', marginBottom: '12px' }}>Agent Details</div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {agents.map((agent) => (
              <div key={agent.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700 }}>{agent.name}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>{agent.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default DiagnosticsPage;