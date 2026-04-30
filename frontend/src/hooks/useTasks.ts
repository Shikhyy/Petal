import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask, getApiErrorMessage, Task } from '../utils/api';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load tasks.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: { title: string; description?: string; priority?: string; tags?: string[]; status?: string }) => {
    try {
      setError(null);
      const created = await createTask(task);
      await fetchTasks();
      return created;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to create task.');
      setError(message);
      throw new Error(message);
    }
  };

  const moveTask = async (id: string, status: Task['status']) => {
    try {
      setError(null);
      const updated = await updateTask(id, { status });
      await fetchTasks();
      return updated;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to update task status.');
      setError(message);
      throw new Error(message);
    }
  };

  const removeTask = async (id: string) => {
    try {
      setError(null);
      await deleteTask(id);
      await fetchTasks();
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to delete task.');
      setError(message);
      throw new Error(message);
    }
  };

  return { tasks, loading, error, fetchTasks, addTask, moveTask, removeTask };
}
