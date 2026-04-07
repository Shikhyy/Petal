import { useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';

export function TasksPage() {
  const { tasks, loading, addTask, moveTask } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const wip = tasks.filter(t => t.status === 'in_progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    return { total, todo, wip, done };
  }, [tasks]);

  const handleCreate = async () => {
    if (!newTaskTitle.trim()) return;
    await addTask({ title: newTaskTitle.trim(), priority: 'medium', status: 'todo', tags: [] });
    setNewTaskTitle('');
  };

  const getPriorityClass = (p: string) => {
    const map: Record<string, string> = { high: 'hi', medium: 'md', low: 'lo' };
    return map[p] || 'md';
  };

  if (loading) return <div className="tasks-container"><div className="empty-state">Loading...</div></div>;

  return (
    <div className="tasks-container">
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
              <div key={task.id} className="task-card" onClick={() => moveTask(task.id, 'in_progress')}>
                <div className="tc-title">{task.title}</div>
                <div className="tc-meta">
                  <span className={`tc-tag ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
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
              <div key={task.id} className="task-card" onClick={() => moveTask(task.id, 'done')}>
                <div className="tc-title">{task.title}</div>
                <div className="tc-meta">
                  <span className={`tc-tag ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
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
          </div>
        </div>
      </div>
    </div>
  );
}
