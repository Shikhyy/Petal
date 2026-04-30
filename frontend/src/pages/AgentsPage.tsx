import { useAgents } from '../hooks/useAgents';
import { useState } from 'react';
import { runAgentsHealthcheck, type AgentHealthcheckResponse } from '../utils/api';
import { useStore } from '../store';
import { AppIcon } from '../components/AppIcon';

const agentNotes = [
  {
    name: 'Orchestrator',
    description: 'Routes requests to the right specialist and falls back to general chat. Coordinates multi-agent workflows and manages request flow.',
    role: 'System',
  },
  {
    name: 'TaskAgent',
    description: 'Creates, updates, lists, and deletes tasks. Manages your entire task management lifecycle and productivity tracking.',
    role: 'Productivity',
  },
  {
    name: 'CalAgent',
    description: 'Handles meeting and calendar workflows. Manages events, schedules, and time coordination across platforms.',
    role: 'Scheduling',
  },
  {
    name: 'InfoAgent',
    description: 'Saves, lists, and retrieves notes and knowledge. Your persistent memory system and information retrieval engine.',
    role: 'Memory',
  },
];

export function AgentsPage() {
  const { agents, loading, error, refetch } = useAgents();
  const recentAgentActivity = useStore((s) => s.recentAgentActivity);
  const [healthcheck, setHealthcheck] = useState<AgentHealthcheckResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const formatLastActive = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'No recent activity';
    const ms = seconds * 1000;
    const diff = Date.now() - ms;
    if (diff < 60_000) return 'Active just now';
    if (diff < 3_600_000) return `Active ${Math.max(1, Math.floor(diff / 60_000))}m ago`;
    if (diff < 86_400_000) return `Active ${Math.floor(diff / 3_600_000)}h ago`;
    return `Active ${Math.floor(diff / 86_400_000)}d ago`;
  };

  const normalizeAgentKey = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('task')) return 'task_agent';
    if (lower.includes('cal')) return 'cal_agent';
    if (lower.includes('info')) return 'info_agent';
    if (lower.includes('orchestrator')) return 'orchestrator';
    return lower;
  };

  const withRecentActivity = agents.map((agent) => {
    const key = normalizeAgentKey(agent.name);
    const lastLocal = recentAgentActivity[key] || 0;
    const lastRemote = (agent.last_active || 0) * 1000;
    const freshest = Math.max(lastLocal, lastRemote);
    const activeWindowMs = 45_000;
    const status = freshest > 0 && Date.now() - freshest < activeWindowMs && agent.status === 'idle'
      ? 'working'
      : agent.status;

    return {
      ...agent,
      status,
      effectiveLastActiveSeconds: freshest > 0 ? Math.floor(freshest / 1000) : agent.last_active,
    };
  });

  const agentMap = new Map(withRecentActivity.map((agent) => [agent.name.toLowerCase(), agent]));
  const workingCount = withRecentActivity.filter((agent) => agent.status === 'working').length;
  const idleCount = withRecentActivity.filter((agent) => agent.status === 'idle').length;
  const errorCount = withRecentActivity.filter((agent) => agent.status === 'error').length;
  const totalHealth = withRecentActivity.length || agentNotes.length;

  const runHealthcheck = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const data = await runAgentsHealthcheck();
      setHealthcheck(data);
    } catch (err: any) {
      setCheckError(err?.message || 'Failed to run agent healthcheck.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="agent-panel">
      <div className="agent-control-header">
        <div className="agent-control-title">AGENT COMMAND CENTER</div>
        <div className="agent-control-subtitle">Real-time multi-agent orchestration and system health monitoring</div>
      </div>

      <div className="agent-grid-stats">
        {[
          { label: 'Total Agents', value: String(totalHealth), icon: 'agents' },
          { label: 'Working', value: String(workingCount), icon: 'spark' },
          { label: 'Standby', value: String(idleCount), icon: 'task' },
          { label: 'Errors', value: String(errorCount), icon: 'diagnostics' },
        ].map((stat) => (
          <div key={stat.label} className="agent-stat-card">
            <div className="agent-stat-label">
              <AppIcon name={stat.icon as any} size={14} />
              {stat.label}
            </div>
            <div className="agent-stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 24px', display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => void refetch()}
          style={{
            padding: '10px 16px',
            border: '2px solid var(--ink)',
            background: 'var(--c3)',
            color: 'var(--ink)',
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.15s',
            letterSpacing: '1px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c5)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--c3)')}
        >
          {loading ? 'Refreshing...' : 'Refresh Agent Status'}
        </button>
        <button
          type="button"
          onClick={() => void runHealthcheck()}
          style={{
            padding: '10px 16px',
            border: '2px solid var(--ink)',
            background: 'var(--c4)',
            color: 'var(--c1)',
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.15s',
            letterSpacing: '1px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c5)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--c4)')}
        >
          {checking ? 'Running Check...' : 'Run Live Healthcheck'}
        </button>
      </div>

      {error && (
        <div style={{ margin: '0 24px 12px', border: '2px solid var(--ink)', background: 'rgba(239,68,68,0.12)', color: '#991b1b', padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: '11px' }}>
          {error}
        </div>
      )}

      <div className="agent-cards-grid">
        {agentNotes.map((agent) => {
          const liveAgent = agentMap.get(agent.name.toLowerCase());
          const status = liveAgent?.status || 'idle';
          const icon = agent.name === 'Orchestrator'
            ? 'spark'
            : agent.name.toLowerCase().includes('task')
              ? 'task'
              : agent.name.toLowerCase().includes('cal')
                ? 'calendar'
                : 'note';

          return (
            <div key={agent.name} className={`agent-card ${status}`}>
              <div className="agent-card-header">
                <div>
                  <div className="agent-card-title">{agent.name}</div>
                </div>
                <div
                  className="agent-card-badge"
                  style={{
                    background: status === 'working' ? 'var(--c3)' : status === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  {status.toUpperCase()}
                </div>
              </div>
              <div className="agent-card-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid var(--ink)', background: status === 'working' ? 'var(--c3)' : 'var(--c2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <AppIcon name={icon as any} size={16} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--c5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {agent.role}
                    </div>
                  </div>
                </div>
                <div className="agent-desc">{agent.description}</div>
              </div>
              <div className="agent-metrics">
                <div className="agent-metric-item">
                  <div className="agent-metric-label">Last Active</div>
                  <div className="agent-metric-value">{formatLastActive(liveAgent?.effectiveLastActiveSeconds)}</div>
                </div>
                <div className="agent-metric-item">
                  <div className="agent-metric-label">Current Mode</div>
                  <div className="agent-metric-value">{status === 'working' ? 'Executing' : 'Standing by'}</div>
                </div>
              </div>
              <div className="agent-card-footer">
                <button
                  className="agent-control-btn"
                  style={{ cursor: 'default', opacity: 0.6 }}
                  title="Coming soon"
                >
                  View Logs
                </button>
                <button
                  className="agent-control-btn"
                  style={{ cursor: 'default', opacity: 0.6 }}
                  title="Coming soon"
                >
                  Metrics
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="agent-healthcheck-panel">
        <div className="healthcheck-header">Live Status Snapshot</div>
        <div className="healthcheck-content">
          {withRecentActivity.length > 0 ? (
            <div style={{ display: 'grid', gap: '0' }}>
              {withRecentActivity.map((agent) => (
                <div key={agent.name} className="healthcheck-result">
                  <span className="healthcheck-agent-name">{agent.name}</span>
                  <span className={agent.status === 'error' ? 'healthcheck-status-err' : 'healthcheck-status-ok'}>
                    {agent.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div>{loading ? 'Loading agent status...' : 'No agent status received yet.'}</div>
          )}
        </div>
      </div>

      {(checkError || healthcheck) && (
        <div className="agent-healthcheck-panel" style={{ marginTop: '24px', marginBottom: '24px' }}>
          <div className="healthcheck-header">Agent Healthcheck Results</div>
          <div className="healthcheck-content">
            {checkError && (
              <div style={{ marginBottom: '12px', border: '2px solid var(--ink)', background: 'rgba(239,68,68,0.12)', color: '#991b1b', padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: '11px' }}>
                {checkError}
              </div>
            )}
            {healthcheck && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', fontFamily: 'var(--mono)', fontSize: '11px' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>Overall:</span> {healthcheck.overall.toUpperCase()}
                  </div>
                  <div style={{ color: 'var(--c5)' }}>
                    Instance: {healthcheck.instance}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '0' }}>
                  {healthcheck.results.map((r) => (
                    <div key={r.agent} className="healthcheck-result">
                      <span className="healthcheck-agent-name">{r.agent}</span>
                      <span className={r.status === 'ok' ? 'healthcheck-status-ok' : 'healthcheck-status-err'}>
                        {r.status.toUpperCase()} · {r.latency_ms}ms
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentsPage;
