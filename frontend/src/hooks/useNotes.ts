import { useState, useEffect, useCallback } from 'react';
import { getNotes, createNote, updateNote as apiUpdateNote, getApiErrorMessage, Note } from '../utils/api';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setError(null);
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load notes.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (note: { title: string; body?: string; tags?: string[] }) => {
    try {
      setError(null);
      const created = await createNote(note);
      await fetchNotes();
      return created;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to create note.');
      setError(message);
      throw new Error(message);
    }
  };

  const updateNote = async (id: string, data: { title?: string; body?: string; tags?: string[]; deleted?: boolean }) => {
    try {
      setError(null);
      const updated = await apiUpdateNote(id, data);
      await fetchNotes();
      return updated;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to update note.');
      setError(message);
      throw new Error(message);
    }
  };

  return { notes, loading, error, fetchNotes, addNote, updateNote };
}
