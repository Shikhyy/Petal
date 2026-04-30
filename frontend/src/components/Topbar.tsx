import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAgentsStatus, AgentStatus } from '../utils/api';
import { useStore } from '../store';
import { WinnerStamp } from './WinnerStamp';

interface MCPStatus {
  configured: number;
  connected: number;
}

export function Topbar() {
  const recentAgentActivity = useStore((s) => s.recentAgentActivity);
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'Orchestrator', status: 'idle', color: '#ff3b30' },
    { name: 'TaskAgent', status: 'idle', color: '#007aff' },
    { name: 'CalAgent', status: 'idle', color: '#34c759' },
    { name: 'InfoAgent', status: 'idle', color: '#ff9500' },
  ]);
  const [mcpStatus, setMcpStatus] = useState<MCPStatus>({ configured: 0, connected: 0 });
  const [notesCount, setNotesCount] = useState(0);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await getAgentsStatus();
        if (data.agents && data.agents.length > 0) {
          setAgents(data.agents);
        }
      } catch (err) {
        console.error('Failed to fetch agent status:', err);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMCPStatus = async () => {
      try {
        const res = await fetch('/api/v1/mcp/status');
        const data = await res.json();
        if (data.status === 'ok' && data.data) {
          setMcpStatus({
            configured: data.data.services?.length || 0,
            connected: data.data.services?.filter((s: any) => s.connected)?.length || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch MCP status:', err);
      }
    };

    fetchMCPStatus();
    const interval = setInterval(fetchMCPStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNotesCount = async () => {
      try {
        const res = await fetch('/api/v1/notes');
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotesCount(data.length);
        }
      } catch (err) {
        console.error('Failed to fetch notes:', err);
      }
    };

    fetchNotesCount();
  }, []);

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
    const activeWindowMs = 45000;
    const locallyActive = freshest > 0 && Date.now() - freshest < activeWindowMs;
    if (locallyActive && agent.status === 'idle') {
      return { ...agent, status: 'working' as const };
    }
    return agent;
  });

  const statusLine = useMemo(() => {
    const workingCount = withRecentActivity.filter((agent) => agent.status === 'working').length;
    const readyCount = withRecentActivity.filter((agent) => agent.status !== 'error').length;
    const mcpText = mcpStatus.configured > 0 ? `${mcpStatus.connected}/${mcpStatus.configured} MCP` : '';
    const notesText = notesCount > 0 ? `${notesCount} notes` : '';
    const parts = [
      `${workingCount}/${readyCount} agents`,
      mcpText,
      notesText,
    ].filter(Boolean);
    return parts.join(' • ');
  }, [withRecentActivity, mcpStatus, notesCount]);

  return (
    <header className="topbar">
      <Link to="/" className="topbar-logo">
        <span className="logo-word">PETAL</span>
        <span className="logo-sub">multi-agent</span>
      </Link>
      <div className="topbar-status">
        <span className="status-dot" />
        <span className="status-text">{statusLine || 'loading...'}</span>
        <WinnerStamp compact className="topbar-winner-stamp" />
      </div>
      <div className="agent-pills">
        {withRecentActivity.map((agent, i) => (
          <div key={i} className={`apill ${agent.status === 'working' ? 'on' : ''} ${agent.status === 'error' ? 'err' : ''}`}>
            <div className="apill-row">
              <span className="apill-dot" />
              <span className="pname">{agent.name.replace(/agent/i, ' Agent')}</span>
            </div>
            <span className={`pstate ${agent.status === 'working' ? 'blink' : ''}`}>
              {agent.status}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}