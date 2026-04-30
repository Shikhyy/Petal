import { useMemo, useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useNotes } from '../hooks/useNotes';
import { useAgents } from '../hooks/useAgents';
import { AppIcon } from '../components/AppIcon';
import { Skeleton, SkeletonText } from '../components/Skeleton';

interface ActivityItem {
  id: string;
  agent: string;
  action: string;
  time: string;
  timestamp: number;
  type: 'task' | 'calendar' | 'note' | 'system';
  details?: string;
}

export function ActivityPage() {
  const [filter, setFilter] = useState<string>('all');
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { notes, loading: notesLoading, error: notesError } = useNotes();
  const { agents, loading: agentsLoading, error: agentsError } = useAgents();

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

  const activities = useMemo<ActivityItem[]>(() => {
    const taskItems: ActivityItem[] = tasks.map((task) => {
      const ts = new Date(task.updated_at || task.created_at).getTime();
      const action = task.status === 'done'
        ? `Completed task "${task.title}"`
        : task.status === 'in_progress'
          ? `Updated task "${task.title}"`
          : `Created task "${task.title}"`;
      return {
        id: `task-${task.id}`,
        agent: 'TaskAgent',
        action,
        time: relativeTime(task.updated_at || task.created_at),
        timestamp: Number.isNaN(ts) ? Date.now() : ts,
        type: 'task',
        details: `Priority: ${task.priority || 'medium'}${task.due_date ? ` • Due: ${new Date(task.due_date).toLocaleDateString()}` : ''}`,
      };
    });

    const noteItems: ActivityItem[] = notes.map((note) => {
      const ts = new Date(note.updated_at || note.created_at).getTime();
      return {
        id: `note-${note.id}`,
        agent: 'InfoAgent',
        action: `Updated note "${note.title}"`,
        time: relativeTime(note.updated_at || note.created_at),
        timestamp: Number.isNaN(ts) ? Date.now() : ts,
        type: 'note',
        details: note.tags?.length ? `${note.tags.length} tag(s)` : 'No tags',
      };
    });

    const agentItems: ActivityItem[] = agents
      .filter((agent) => typeof agent.last_active === 'number')
      .map((agent) => {
        const rawTs = (agent.last_active || 0) * 1000;
        const ts = rawTs > 0 ? rawTs : Date.now();
        return {
          id: `agent-${agent.name}`,
          agent: agent.name,
          action: `${agent.name} is ${agent.status}`,
          time: agent.last_active ? relativeTime(new Date(rawTs).toISOString()) : 'just now',
          timestamp: ts,
          type: 'system',
          details: `Status: ${agent.status}`,
        };
      });

    return [...taskItems, ...noteItems, ...agentItems]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 40);
  }, [tasks, notes, agents]);

  const typeColors: Record<string, string> = {
    task: 'var(--c3)',
    calendar: 'var(--c4)',
    note: 'var(--c2)',
    system: 'var(--c5)',
  };

  const typeIcons: Record<string, Parameters<typeof AppIcon>[0]['name']> = {
    task: 'task',
    calendar: 'calendar',
    note: 'note',
    system: 'spark',
  };

  const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter);
  const loading = tasksLoading || notesLoading || agentsLoading;
  const combinedError = tasksError || notesError || agentsError;

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
        {combinedError && (
          <div style={{ marginBottom: '14px', padding: '10px 12px', border: '2px solid var(--ink)', background: 'rgba(239,68,68,0.12)', color: '#991b1b', fontFamily: 'var(--mono)', fontSize: '11px' }}>
            {combinedError}
          </div>
        )}
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
          {loading && (
            <div style={{ padding: '16px 20px', display: 'grid', gap: 14 }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <Skeleton width={40} height={40} radius={4} />
                  <div style={{ flex: 1 }}>
                    <Skeleton height={14} width={`${76 - index * 4}%`} radius={999} style={{ marginBottom: 8 }} />
                    <SkeletonText lines={2} widths={["54%", "32%"]} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '16px 20px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>
              No activity yet for this filter.
            </div>
          )}
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
                flexShrink: 0,
                color: 'var(--ink)',
              }}>
                <AppIcon name={typeIcons[activity.type]} size={18} />
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