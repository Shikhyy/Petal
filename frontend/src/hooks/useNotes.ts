import { useState, useEffect, useCallback } from 'react';
import { getNotes, createNote, updateNote as apiUpdateNote, Note } from '../utils/api';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (note: { title: string; body?: string; tags?: string[] }) => {
    const created = await createNote(note);
    setNotes((prev) => [created, ...prev]);
    return created;
  };

  const updateNote = async (id: string, data: { title?: string; body?: string; tags?: string[]; deleted?: boolean }) => {
    const updated = await apiUpdateNote(id, data);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    return updated;
  };

  return { notes, loading, fetchNotes, addNote, updateNote };
}
