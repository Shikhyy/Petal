import { useState } from 'react';
import { useNotes } from '../hooks/useNotes';
import { Note } from '../utils/api';

export function KnowledgePage() {
  const { notes, loading, addNote, updateNote } = useNotes();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const handleNew = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditBody('');
  };

  const handleSelect = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditBody(note.body || '');
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    if (selectedNote) {
      await updateNote(selectedNote.id, { title: editTitle.trim(), body: editBody });
    } else {
      await addNote({ title: editTitle.trim(), body: editBody, tags: [] });
    }
    handleNew();
  };

  const handleDelete = async () => {
    if (selectedNote) {
      await updateNote(selectedNote.id, { deleted: true });
      handleNew();
    }
  };

  if (loading) return <div className="notes-container"><div className="empty-state">Loading...</div></div>;

  return (
    <div className="notes-container">
      <div className="notes-list-col">
        <div className="nl-header">
          <span className="nl-title">Notes ({notes.length})</span>
          <button className="nl-new" onClick={handleNew}>+ NEW</button>
        </div>
        <div className="nl-list">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`nl-item ${selectedNote?.id === note.id ? 'active' : ''}`}
              onClick={() => handleSelect(note)}
            >
              <div className="ni-title">{note.title}</div>
              <div className="ni-prev">
                {note.body?.substring(0, 50) || 'No content'}
              </div>
              <div className="ni-date">
                {new Date(note.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>
              No notes yet. Click + NEW to create one.
            </div>
          )}
        </div>
      </div>
      <div className="note-editor-col">
        <div className="ne-toolbar">
          <button className="ne-btn" onClick={handleSave}>SAVE</button>
          <button className="ne-btn" onClick={handleDelete}>DELETE</button>
        </div>
        <input
          type="text"
          className="ne-title-inp"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Note title..."
        />
        <textarea
          className="ne-body-inp"
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
}
