import { useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { Skeleton } from '../components/Skeleton';

export function TasksPage() {
  const { tasks, loading, error, addTask, moveTask, removeTask } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const wip = tasks.filter(t => t.status === 'in_progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    return { total, todo, wip, done };
  }, [tasks]);

  const handleCreate = async () => {
    if (!newTaskTitle.trim()) return;
    setActionError(null);
    try {
      await addTask({ title: newTaskTitle.trim(), priority: 'medium', status: 'todo', tags: [] });
      setNewTaskTitle('');
    } catch (err: any) {
      setActionError(err?.message || 'Could not create task.');
    }
  };

  const handleMove = async (id: string, status: 'in_progress' | 'done') => {
    setActionError(null);
    try {
      await moveTask(id, status);
    } catch (err: any) {
      setActionError(err?.message || 'Could not update task.');
    }
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await removeTask(id);
    } catch (err: any) {
      setActionError(err?.message || 'Could not delete task.');
    }
  };

  const getPriorityClass = (p: string) => {
    const map: Record<string, string> = { high: 'hi', medium: 'md', low: 'lo' };
    return map[p] || 'md';
  };

  if (loading) {
    return (
      <div className="tasks-container">
        <div className="page-brutal-header">
          <div className="pbh-accent"></div>
          <div className="pbh-content">
            <Skeleton height={18} width="42%" radius={0} style={{ marginBottom: 10 }} />
            <Skeleton height={12} width="24%" radius={999} />
          </div>
        </div>

        <div className="stats-row">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="stat-box">
              <Skeleton height={10} width="40%" radius={999} style={{ marginBottom: 10 }} />
              <Skeleton height={32} width="70%" radius={0} />
            </div>
          ))}
        </div>

        <div className="task-board">
          {Array.from({ length: 3 }).map((_, columnIndex) => (
            <div key={columnIndex} className={`board-col ${columnIndex === 0 ? 'col-todo' : columnIndex === 1 ? 'col-wip' : 'col-done'}`}>
              <div className="board-col-header">
                <div className="bch-dot"></div>
                {columnIndex === 0 ? 'To Do' : columnIndex === 1 ? 'In Progress' : 'Done'}
              </div>
              <div className="board-tasks" style={{ display: 'grid', gap: '10px' }}>
                {Array.from({ length: 3 - columnIndex }).map((__, cardIndex) => (
                  <div key={cardIndex} className="task-card" style={{ pointerEvents: 'none' }}>
                    <Skeleton height={14} width={`${80 - cardIndex * 8}%`} radius={999} style={{ marginBottom: 10 }} />
                    <div className="tc-meta" style={{ display: 'flex', gap: 8 }}>
                      <Skeleton height={20} width={56} radius={999} />
                      <Skeleton height={20} width={42} radius={4} />
                    </div>
                  </div>
                ))}
                <Skeleton height={34} width="100%" radius={4} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-container">
      {(error || actionError) && (
        <div style={{ margin: '10px 0', padding: '10px 12px', border: '2px solid var(--ink)', background: 'rgba(239,68,68,0.12)', color: '#991b1b', fontFamily: 'var(--mono)', fontSize: '11px' }}>
          {actionError || error}
        </div>
      )}
      <div className="page-brutal-header">
        <div className="pbh-accent"></div>
        <div className="pbh-content">
          <h1 className="pbh-title">Task Board</h1>
          <div className="pbh-sub">Manage your workflow</div>
        </div>
      </div>
      
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-lbl">Total</div>
          <div className="stat-num s1">{stats.total}</div>
        </div>
        <div className="stat-box">
          <div className="stat-lbl">To Do</div>
          <div className="stat-num s2">{stats.todo}</div>
        </div>
        <div className="stat-box">
          <div className="stat-lbl">In Progress</div>
          <div className="stat-num s3">{stats.wip}</div>
        </div>
        <div className="stat-box">
          <div className="stat-lbl">Done</div>
          <div className="stat-num s4">{stats.done}</div>
        </div>
      </div>

      <div className="task-board">
        <div className="board-col col-todo">
          <div className="board-col-header">
            <div className="bch-dot"></div>
            To Do
          </div>
          <div className="board-tasks">
            {tasks.filter(t => t.status === 'todo').map(task => (
              <div key={task.id} className="task-card" onClick={() => handleMove(task.id, 'in_progress')}>
                <div className="tc-title">{task.title}</div>
                <div className="tc-meta">
                  <span className={`tc-tag ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void handleDelete(task.id); }}
                    style={{ marginLeft: '8px', fontSize: '9px', padding: '2px 6px', border: '1px solid var(--ink)', background: 'var(--paper)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === 'todo').length === 0 && (
              <div style={{ fontSize: '11px', opacity: 0.7 }}>No tasks in To Do.</div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Add task..."
                style={{ fontSize: '11px', padding: '6px 10px' }}
              />
              <button onClick={handleCreate} style={{ padding: '6px 10px', fontSize: '10px' }}>+</button>
            </div>
          </div>
        </div>
        <div className="board-col col-wip">
          <div className="board-col-header">
            <div className="bch-dot"></div>
            In Progress
          </div>
          <div className="board-tasks">
            {tasks.filter(t => t.status === 'in_progress').map(task => (
              <div key={task.id} className="task-card" onClick={() => handleMove(task.id, 'done')}>
                <div className="tc-title">{task.title}</div>
                <div className="tc-meta">
                  <span className={`tc-tag ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === 'in_progress').length === 0 && (
              <div style={{ fontSize: '11px', opacity: 0.7 }}>No tasks in progress.</div>
            )}
          </div>
        </div>
        <div className="board-col col-done">
          <div className="board-col-header">
            <div className="bch-dot"></div>
            Done
          </div>
          <div className="board-tasks">
            {tasks.filter(t => t.status === 'done').map(task => (
              <div key={task.id} className="task-card done-card">
                <div className="tc-title">{task.title}</div>
                <div className="tc-meta">
                  <span className={`tc-tag ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === 'done').length === 0 && (
              <div style={{ fontSize: '11px', opacity: 0.7 }}>No completed tasks yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
