import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask, Task } from '../utils/api';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: { title: string; description?: string; priority?: string; tags?: string[]; status?: string }) => {
    const created = await createTask(task);
    setTasks((prev) => [created, ...prev]);
    return created;
  };

  const moveTask = async (id: string, status: Task['status']) => {
    const updated = await updateTask(id, { status });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const removeTask = async (id: string) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, loading, fetchTasks, addTask, moveTask, removeTask };
}
