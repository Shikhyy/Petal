import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  agent: string;
  action: string;
  time: string;
  type: 'task' | 'calendar' | 'note' | 'system';
}

interface QuickAction {
  label: string;
  icon: string;
  color: string;
  action: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [activities] = useState<Activity[]>([
    { id: '1', agent: 'TaskAgent', action: 'Created "Review PR #42"', time: '2m ago', type: 'task' },
    { id: '2', agent: 'CalAgent', action: 'Scheduled "Team Standup" at 10:00 AM', time: '15m ago', type: 'calendar' },
    { id: '3', agent: 'InfoAgent', action: 'Saved note "Q2 Planning Ideas"', time: '1h ago', type: 'note' },
    { id: '4', agent: 'Orchestrator', action: 'Routed request to TaskAgent', time: '1h ago', type: 'system' },
    { id: '5', agent: 'TaskAgent', action: 'Completed "Setup CI/CD pipeline"', time: '2h ago', type: 'task' },
    { id: '6', agent: 'CalAgent', action: 'Updated calendar sync', time: '3h ago', type: 'calendar' },
  ]);

  const quickActions: QuickAction[] = [
    { label: 'New Task', icon: '✓', color: 'var(--c3)', action: 'task' },
    { label: 'Schedule Event', icon: '📅', color: 'var(--c4)', action: 'calendar' },
    { label: 'Take Note', icon: '📝', color: 'var(--c2)', action: 'note' },
    { label: 'Ask Agent', icon: '💬', color: 'var(--c5)', action: 'chat' },
  ];

  const stats = [
    { label: 'Tasks Today', value: '7', change: '+3', icon: '✓', color: 'var(--c5)' },
    { label: 'Events Today', value: '3', change: '1 upcoming', icon: '📅', color: 'var(--c3)' },
    { label: 'Notes This Week', value: '12', change: '+8', icon: '📝', color: 'var(--c4)' },
    { label: 'Agent Actions', value: '47', change: 'today', icon: '⚡', color: 'var(--c2)' },
  ];

  const upcomingEvents = [
    { time: '10:00 AM', title: 'Team Standup', type: 'meeting' },
    { time: '1:00 PM', title: 'Design Review', type: 'review' },
    { time: '3:30 PM', title: '1-on-1 with Sarah', type: 'meeting' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'task': navigate('/app/tasks'); break;
      case 'calendar': navigate('/app/calendar'); break;
      case 'note': navigate('/app/knowledge'); break;
      case 'chat': navigate('/app'); break;
    }
  };

  const typeColors: Record<string, string> = {
    task: 'var(--c3)',
    calendar: 'var(--c4)',
    note: 'var(--c2)',
    system: 'var(--c5)',
  };

  const hour = time.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">DASHBOARD</h1>
            <p className="ch-desc">
              {greeting} • {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {time.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: '24px' }}>
        {/* Quick Actions */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--c5)', marginBottom: '12px' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', border: '4px solid var(--ink)' }}>
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action.action)}
                style={{
                  padding: '20px 16px',
                  background: action.color,
                  border: 'none',
                  borderRight: i < 3 ? '2px solid var(--ink)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--sans)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--ink)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--c1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.background = action.color;
                  (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
                }}
              >
                <span style={{ fontSize: '24px' }}>{action.icon}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', border: '4px solid var(--ink)' }}>
            {stats.map((stat, i) => (
              <div key={i} style={{
                padding: '20px',
                borderRight: i < 3 ? '2px solid var(--ink)' : 'none',
                transition: 'all 0.2s',
                cursor: 'default',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{stat.icon}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>{stat.label}</span>
                </div>
                <div style={{ fontFamily: 'var(--display)', fontSize: '44px', lineHeight: '1', color: stat.color }}>{stat.value}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', marginTop: '4px' }}>{stat.change}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          {/* Activity Feed */}
          <div style={{ border: '4px solid var(--ink)' }}>
            <div style={{ background: 'var(--c5)', padding: '14px 20px', borderBottom: '3px solid var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c1)' }}>Recent Activity</span>
              <Link to="/app/activity" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c3)', textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ padding: '12px' }}>
              {activities.map((activity, i) => (
                <div key={activity.id} style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  borderBottom: i < activities.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}>
                  <div style={{
                    width: '4px',
                    background: typeColors[activity.type],
                    border: '1px solid var(--ink)',
                    flexShrink: 0,
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{activity.action}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', marginTop: '4px' }}>
                      {activity.agent} • {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Upcoming Events */}
            <div style={{ border: '4px solid var(--ink)' }}>
              <div style={{ background: 'var(--c4)', padding: '14px 20px', borderBottom: '3px solid var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c1)' }}>Upcoming</span>
                <Link to="/app/calendar" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c2)', textDecoration: 'none' }}>Calendar →</Link>
              </div>
              <div style={{ padding: '12px' }}>
                {upcomingEvents.map((event, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom: i < upcomingEvents.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '10px',
                      color: 'var(--c5)',
                      minWidth: '60px',
                    }}>{event.time}</div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: 'var(--c3)',
                      border: '2px solid var(--ink)',
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}></div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{event.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Status */}
            <div style={{ border: '4px solid var(--ink)' }}>
              <div style={{ background: 'var(--c3)', padding: '14px 20px', borderBottom: '3px solid var(--ink)' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink)' }}>Agent Status</span>
              </div>
              <div style={{ padding: '12px' }}>
                {[
                  { name: 'Orchestrator', status: 'idle', emoji: '🎭' },
                  { name: 'Task Agent', status: 'idle', emoji: '⚡' },
                  { name: 'Calendar Agent', status: 'idle', emoji: '📆' },
                  { name: 'Info Agent', status: 'idle', emoji: '📚' },
                ].map((agent, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 0',
                    borderBottom: i < 3 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                  }}>
                    <span style={{ fontSize: '14px' }}>{agent.emoji}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, flex: 1 }}>{agent.name}</span>
                    <span style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '9px',
                      padding: '2px 8px',
                      background: agent.status === 'idle' ? 'var(--c2)' : 'var(--c3)',
                      border: '1.5px solid var(--ink)',
                    }}>{agent.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;