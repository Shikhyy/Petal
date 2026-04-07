import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  path: string;
  icon: string;
  category: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const allResults: SearchResult[] = [
    { id: '1', title: 'Dashboard', path: '/app/dashboard', icon: '◈', category: 'Main' },
    { id: '2', title: 'Chat', path: '/app', icon: '💬', category: 'Main' },
    { id: '3', title: 'Tasks', path: '/app/tasks', icon: '✓', category: 'Main' },
    { id: '4', title: 'Calendar', path: '/app/calendar', icon: '📅', category: 'Main' },
    { id: '5', title: 'Knowledge', path: '/app/knowledge', icon: '📝', category: 'Main' },
    { id: '6', title: 'Agents', path: '/app/agents', icon: '⚡', category: 'Tools' },
    { id: '7', title: 'MCP Servers', path: '/app/mcp', icon: '🔌', category: 'Tools' },
    { id: '8', title: 'Connections', path: '/app/connections', icon: '🔗', category: 'Tools' },
    { id: '9', title: 'Activity', path: '/app/activity', icon: '📊', category: 'Tools' },
    { id: '10', title: 'Settings', path: '/app/settings', icon: '⚙️', category: 'System' },
    { id: '11', title: 'Profile', path: '/app/profile', icon: '👤', category: 'System' },
    { id: '12', title: 'Help', path: '/app/help', icon: '❓', category: 'System' },
  ];

  const filtered = query
    ? allResults.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.category.toLowerCase().includes(query.toLowerCase())
      )
    : allResults;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          background: 'var(--c5)',
          border: '3px solid var(--ink)',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          boxShadow: '4px 4px 0 var(--ink)',
          zIndex: 1000,
          transition: 'all 0.15s',
        }}
        title="Search (⌘K)"
      >
        🔍
      </button>
    );
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
        }}
      />
      <div style={{
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        maxWidth: '90vw',
        background: 'var(--paper)',
        border: '4px solid var(--ink)',
        boxShadow: '8px 8px 0 var(--ink)',
        zIndex: 1000,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '3px solid var(--ink)',
          background: 'var(--c1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '16px',
              fontFamily: 'var(--sans)',
              outline: 'none',
            }}
          />
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            padding: '4px 8px',
            background: 'var(--c5)',
            color: 'var(--c1)',
            border: '1.5px solid var(--ink)',
          }}>ESC</span>
        </div>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {filtered.map((result, i) => (
            <div
              key={result.id}
              onClick={() => handleSelect(result)}
              style={{
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                background: i === selectedIndex ? 'var(--c2)' : 'transparent',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                transition: 'background 0.1s',
              }}
            >
              <span style={{ fontSize: '16px' }}>{result.icon}</span>
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{result.title}</span>
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: '9px',
                padding: '2px 8px',
                background: 'var(--mid)',
                border: '1.5px solid var(--ink)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>{result.category}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--c5)' }}>
              No results found
            </div>
          )}
        </div>
        <div style={{
          padding: '10px 20px',
          borderTop: '2px solid var(--ink)',
          background: 'var(--mid)',
          display: 'flex',
          gap: '16px',
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          color: 'var(--c5)',
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </>
  );
}

export default CommandPalette;