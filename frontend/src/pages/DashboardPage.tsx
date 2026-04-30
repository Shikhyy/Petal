import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useNotes } from '../hooks/useNotes';
import { useAgents } from '../hooks/useAgents';
import { getApiErrorMessage, getEvents } from '../utils/api';
import { Skeleton } from '../components/Skeleton';

interface Activity {
  id: string;
  agent: string;
  action: string;
  time: string;
  type: 'task' | 'calendar' | 'note' | 'system';
}

type IconName = 'task' | 'calendar' | 'note' | 'chat' | 'spark' | 'orchestrator' | 'info';

interface QuickAction {
  label: string;
  icon: IconName;
  color: string;
  action: string;
}

interface DashboardStat {
  label: string;
  value: string;
  change: string;
  icon: IconName;
  color: string;
}

function DashboardIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'task') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" {...common} />
        <path d="M7 9h10" {...common} />
        <path d="M7 13h6" {...common} />
        <path d="M7 17h4" {...common} />
      </svg>
    );
  }
  if (name === 'calendar') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" {...common} />
        <path d="M8 3v4" {...common} />
        <path d="M16 3v4" {...common} />
        <path d="M3 10h18" {...common} />
        <path d="M8 14h3" {...common} />
      </svg>
    );
  }
  if (name === 'note') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3h9l3 3v15H6z" {...common} />
        <path d="M15 3v4h4" {...common} />
        <path d="M9 12h6" {...common} />
        <path d="M9 16h4" {...common} />
      </svg>
    );
  }
  if (name === 'chat') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h16v10H9l-5 4z" {...common} />
        <path d="M8 9h8" {...common} />
        <path d="M8 12h6" {...common} />
      </svg>
    );
  }
  if (name === 'spark') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" {...common} />
        <path d="M18 15l.8 1.8L21 17.6l-2.2.9L18 20.3l-.8-1.8-2.2-.9 2.2-.8z" {...common} />
      </svg>
    );
  }
  if (name === 'info') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" {...common} />
        <path d="M12 11v6" {...common} />
        <path d="M12 8h.01" {...common} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" {...common} />
      <path d="M12 7v10" {...common} />
      <path d="M7 12h10" {...common} />
    </svg>
  );
}

function iconForAgent(name: string): IconName {
  const lower = name.toLowerCase();
  if (lower.includes('task')) return 'task';
  if (lower.includes('cal')) return 'calendar';
  if (lower.includes('info')) return 'info';
  return 'orchestrator';
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { notes, loading: notesLoading, error: notesError } = useNotes();
  const { agents, loading: agentsLoading, error: agentsError } = useAgents();
  const [upcomingEvents, setUpcomingEvents] = useState<Array<{ id: string; time: string; title: string; type: string }>>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    { label: 'New Task', icon: 'task', color: 'var(--c3)', action: 'task' },
    { label: 'Schedule Event', icon: 'calendar', color: 'var(--c4)', action: 'calendar' },
    { label: 'Take Note', icon: 'note', color: 'var(--c2)', action: 'note' },
    { label: 'Ask Agent', icon: 'chat', color: 'var(--c5)', action: 'chat' },
  ];

  const relativeTime = (dateString: string) => {
    const ts = new Date(dateString).getTime();
    if (Number.isNaN(ts)) return 'just now';
    const diff = Date.now() - ts;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return 'just now';
    if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
    if (diff < day) return `${Math.floor(diff / hour)}h ago`;
    return `${Math.floor(diff / day)}d ago`;
  };

  const activities = useMemo<Activity[]>(() => {
    const taskActivity: Activity[] = tasks.map((task) => ({
      id: `task-${task.id}`,
      agent: 'TaskAgent',
      action: `${task.status === 'done' ? 'Completed' : 'Updated'} "${task.title}"`,
      time: relativeTime(task.updated_at || task.created_at),
      type: 'task',
    }));

    const noteActivity: Activity[] = notes.map((note) => ({
      id: `note-${note.id}`,
      agent: 'InfoAgent',
      action: `Updated note "${note.title}"`,
      time: relativeTime(note.updated_at || note.created_at),
      type: 'note',
    }));

    const agentActivity: Activity[] = agents
      .filter((agent) => agent.status !== 'idle')
      .map((agent) => ({
        id: `agent-${agent.name}`,
        agent: 'Orchestrator',
        action: `${agent.name} is ${agent.status}`,
        time: agent.last_active ? relativeTime(new Date(agent.last_active * 1000).toISOString()) : 'just now',
        type: 'system',
      }));

    return [...taskActivity, ...noteActivity, ...agentActivity].slice(0, 8);
  }, [tasks, notes, agents]);

  const stats = useMemo<DashboardStat[]>(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const tasksToday = tasks.filter((task) => {
      const ts = new Date(task.created_at).getTime();
      return !Number.isNaN(ts) && ts >= todayStart.getTime();
    }).length;

    const notesThisWeek = notes.filter((note) => {
      const ts = new Date(note.created_at).getTime();
      return !Number.isNaN(ts) && ts >= weekStart.getTime();
    }).length;

    const activeAgents = agents.filter((a) => a.status === 'working').length;

    return [
      { label: 'Tasks Today', value: String(tasksToday), change: `${tasks.filter((t) => t.status === 'done').length} done`, icon: 'task', color: 'var(--c5)' },
      { label: 'Events Today', value: String(upcomingEvents.filter((e) => e.type === 'today').length), change: `${upcomingEvents.length} upcoming`, icon: 'calendar', color: 'var(--c3)' },
      { label: 'Notes This Week', value: String(notesThisWeek), change: `${notes.length} total`, icon: 'note', color: 'var(--c4)' },
      { label: 'Active Agents', value: String(activeAgents), change: `${agents.length} available`, icon: 'spark', color: 'var(--c2)' },
    ];
  }, [tasks, notes, agents, upcomingEvents]);

  const workspacePulse = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'done').length;
    const pending = Math.max(0, tasks.length - completed);
    const activeAgents = agents.filter((a) => a.status === 'working').length;
    return { completed, pending, activeAgents };
  }, [tasks, agents]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14).toISOString();
    setEventsLoading(true);
    setEventsError(null);

    getEvents(start, end)
      .then((events) => {
        const mapped = events
          .filter((event: any) => new Date(event.start_time).getTime() >= Date.now())
          .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
          .slice(0, 5)
          .map((event: any) => {
            const startTime = new Date(event.start_time);
            const dayStart = new Date();
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            return {
              id: event.id,
              time: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              title: event.title,
              type: startTime >= dayStart && startTime < dayEnd ? 'today' : 'upcoming',
            };
          });
        setUpcomingEvents(mapped);
      })
      .catch((err) => {
        setUpcomingEvents([]);
        setEventsError(getApiErrorMessage(err, 'Failed to load upcoming events.'));
      })
      .finally(() => setEventsLoading(false));
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
  const combinedError = tasksError || notesError || agentsError || eventsError;
  const agentRows = agents.length > 0
    ? agents.map((agent) => ({
      name: agent.name,
      status: agent.status,
      icon: iconForAgent(agent.name),
    }))
    : [
      { name: 'Orchestrator', status: 'idle', icon: 'orchestrator' as IconName },
      { name: 'Task Agent', status: 'idle', icon: 'task' as IconName },
      { name: 'Calendar Agent', status: 'idle', icon: 'calendar' as IconName },
      { name: 'Info Agent', status: 'idle', icon: 'info' as IconName },
    ];

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">DASHBOARD</h1>
            <p className="ch-desc">
              {greeting} - {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - {time.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: '24px' }}>
        {combinedError && (
          <div style={{ marginBottom: '14px', padding: '10px 12px', border: '2px solid var(--ink)', background: 'rgba(239,68,68,0.12)', color: '#991b1b', fontFamily: 'var(--mono)', fontSize: '11px' }}>
            {combinedError}
          </div>
        )}

        <div style={{
          marginBottom: '24px',
          border: '4px solid var(--ink)',
          background: 'linear-gradient(135deg, var(--c1) 0%, var(--paper) 70%)',
          padding: '14px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '2px solid var(--ink)', background: 'var(--paper)', padding: '10px' }}>
            <DashboardIcon name="spark" size={16} />
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>Workspace Pulse</div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>{workspacePulse.activeAgents} active • {workspacePulse.pending} pending</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '2px solid var(--ink)', background: 'var(--paper)', padding: '10px' }}>
            <DashboardIcon name="task" size={16} />
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>Tasks Queue</div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>{workspacePulse.pending} pending / {workspacePulse.completed} done</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '2px solid var(--ink)', background: 'var(--paper)', padding: '10px' }}>
            <DashboardIcon name="calendar" size={16} />
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>Upcoming Events</div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>{upcomingEvents.length} in next 2 weeks</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--c5)', marginBottom: '12px' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0', border: '4px solid var(--ink)' }}>
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
                <span style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px' }}>
                  <DashboardIcon name={action.icon} size={22} />
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {tasksLoading || notesLoading || agentsLoading || eventsLoading ? (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ border: '4px solid var(--ink)', padding: '18px', background: 'var(--paper)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} style={{ border: '2px solid var(--ink)', padding: '14px', background: 'var(--paper)' }}>
                    <Skeleton height={10} width="42%" radius={999} style={{ marginBottom: 10 }} />
                    <Skeleton height={30} width="68%" radius={0} style={{ marginBottom: 10 }} />
                    <Skeleton height={10} width="56%" radius={999} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Stats Row */}
        <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0', border: '4px solid var(--ink)' }}>
            {stats.map((stat, i) => (
              <div key={i} style={{
                padding: '20px',
                borderRight: i < 3 ? '2px solid var(--ink)' : 'none',
                transition: 'all 0.2s',
                cursor: 'default',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: '18px', height: '18px' }}>
                    <DashboardIcon name={stat.icon} size={16} />
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)' }}>{stat.label}</span>
                </div>
                <div style={{ fontFamily: 'var(--display)', fontSize: '44px', lineHeight: '1', color: stat.color }}>{stat.value}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', marginTop: '4px' }}>{stat.change}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)', gap: '24px' }}>
          {/* Activity Feed */}
          <div style={{ border: '4px solid var(--ink)' }}>
            <div style={{ background: 'var(--c5)', padding: '14px 20px', borderBottom: '3px solid var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c1)' }}>Recent Activity</span>
              <Link to="/app/activity" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c3)', textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ padding: '12px' }}>
              {(tasksLoading || notesLoading || agentsLoading) && (
                <div style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>
                  Loading activity...
                </div>
              )}
              {!tasksLoading && !notesLoading && !agentsLoading && activities.length === 0 && (
                <div style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>
                  No recent activity yet.
                </div>
              )}
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
                {eventsLoading && (
                  <div style={{ fontSize: '11px', opacity: 0.6 }}>Loading upcoming events...</div>
                )}
                {!eventsLoading && upcomingEvents.length === 0 && (
                  <div style={{ fontSize: '11px', opacity: 0.6 }}>No upcoming events</div>
                )}
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
                {agentRows.map((agent, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 0',
                    borderBottom: i < agentRows.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                  }}>
                    <span style={{ display: 'grid', placeItems: 'center', width: '16px', height: '16px' }}>
                      <DashboardIcon name={agent.icon} size={14} />
                    </span>
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