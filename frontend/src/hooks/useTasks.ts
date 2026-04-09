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
    await fetchTasks();
    return created;
  };

  const moveTask = async (id: string, status: Task['status']) => {
    const updated = await updateTask(id, { status });
    if (updated) {
      await fetchTasks();
      return updated;
    }
    await fetchTasks();
  };

  const removeTask = async (id: string) => {
    await deleteTask(id);
    await fetchTasks();
  };

  return { tasks, loading, fetchTasks, addTask, moveTask, removeTask };
}
