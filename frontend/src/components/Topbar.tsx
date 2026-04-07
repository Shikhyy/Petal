import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAgentsStatus, AgentStatus } from '../utils/api';

const tickerItems = [
  'System initialized',
  'MCP servers: 3 active',
  'Agents ready',
  'Memory: 127 notes indexed',
  'Calendar sync: OK',
];

export function Topbar() {
  const [tickerOffset, setTickerOffset] = useState(0);
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'Orchestrator', status: 'idle', color: '#ff3b30' },
    { name: 'TaskAgent', status: 'idle', color: '#007aff' },
    { name: 'CalAgent', status: 'idle', color: '#34c759' },
    { name: 'InfoAgent', status: 'idle', color: '#ff9500' },
  ]);

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
    const interval = setInterval(() => {
      setTickerOffset(prev => prev - 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <Link to="/" className="topbar-logo">
        <span className="logo-word">PETAL</span>
        <span className="logo-sub">multi-agent</span>
      </Link>
      <div className="topbar-ticker">
        <div className="ticker-wrap">
          <div 
            className="ticker-inner" 
            style={{ transform: `translateX(${tickerOffset}px)` }}
          >
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i}>
                <span className="tick-item">{item}</span>
                <span className="tick-sep"> ● </span>
              </span>
            ))}
          </div>
        </div>
        <div className="gem-badge">
          <span>AI</span> POWERED
        </div>
      </div>
      <div className="agent-pills">
        {agents.map((agent, i) => (
          <div key={i} className={`apill ${agent.status === 'working' ? 'on' : ''}`}>
            <span className="pname">{agent.name.toUpperCase()}</span>
            <span className={`pstate ${agent.status === 'working' ? 'blink' : ''}`}>
              {agent.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}