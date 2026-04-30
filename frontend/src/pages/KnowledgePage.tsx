import { useState } from 'react';
import { useNotes } from '../hooks/useNotes';
import { Note } from '../utils/api';
import { Skeleton, SkeletonText } from '../components/Skeleton';

export function KnowledgePage() {
  const { notes, loading, error, addNote, updateNote } = useNotes();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [actionMessage, setActionMessage] = useState<string>('');

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
    setActionMessage('');
    try {
      if (selectedNote) {
        await updateNote(selectedNote.id, { title: editTitle.trim(), body: editBody });
      } else {
        await addNote({ title: editTitle.trim(), body: editBody, tags: [] });
      }
      setActionMessage('Saved.');
      handleNew();
    } catch (err: any) {
      setActionMessage(err?.message || 'Could not save note.');
    }
  };

  const handleDelete = async () => {
    setActionMessage('');
    if (selectedNote) {
      try {
        await updateNote(selectedNote.id, { deleted: true });
        setActionMessage('Deleted.');
        handleNew();
      } catch (err: any) {
        setActionMessage(err?.message || 'Could not delete note.');
      }
    }
  };

  if (loading) {
    return (
      <div className="notes-container">
        <div className="notes-list-col">
          <div className="nl-header">
            <Skeleton height={14} width="30%" radius={999} />
            <Skeleton height={28} width={72} radius={4} />
          </div>
          <div className="nl-list" style={{ display: 'grid', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="nl-item" style={{ pointerEvents: 'none' }}>
                <Skeleton height={16} width={`${70 - index * 8}%`} radius={999} style={{ marginBottom: 10 }} />
                <SkeletonText lines={2} widths={["92%", "72%"]} />
                <Skeleton height={10} width="42%" radius={999} style={{ marginTop: 10 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="note-editor-col">
          <div className="ne-toolbar">
            <Skeleton height={32} width={76} radius={4} />
            <Skeleton height={32} width={84} radius={4} />
          </div>
          <Skeleton height={44} width="100%" radius={4} style={{ marginBottom: 12 }} />
          <Skeleton height={260} width="100%" radius={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="notes-container">
      {(error || actionMessage) && (
        <div style={{ margin: '10px 0', padding: '10px 12px', border: '2px solid var(--ink)', background: error ? 'rgba(239,68,68,0.12)' : 'rgba(74,222,128,0.15)', color: error ? '#991b1b' : '#14532d', fontFamily: 'var(--mono)', fontSize: '11px' }}>
          {error || actionMessage}
        </div>
      )}
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
          <button className="ne-btn" onClick={handleDelete} disabled={!selectedNote}>DELETE</button>
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
