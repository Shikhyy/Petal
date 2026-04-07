import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const mainNav = [
  { icon: '◈', text: 'Dashboard', path: '/app/dashboard', badge: '' },
  { icon: '💬', text: 'Chat', path: '/app', badge: '' },
  { icon: '✓', text: 'Tasks', path: '/app/tasks', badge: '3' },
  { icon: '📅', text: 'Calendar', path: '/app/calendar', badge: '' },
  { icon: '📝', text: 'Knowledge', path: '/app/knowledge', badge: '127' },
];

const toolsNav = [
  { icon: '⚡', text: 'Agents', path: '/app/agents', badge: '4' },
  { icon: '🔌', text: 'MCP Servers', path: '/app/mcp', badge: '' },
  { icon: '🔗', text: 'Connections', path: '/app/connections', badge: '' },
  { icon: '📊', text: 'Activity', path: '/app/activity', badge: '12' },
];

const systemNav = [
  { icon: '⚙️', text: 'Settings', path: '/app/settings', badge: '' },
  { icon: '👤', text: 'Profile', path: '/app/profile', badge: '' },
  { icon: '❓', text: 'Help', path: '/app/help', badge: '' },
];

export function Sidebar() {
  const { user, logout, authenticated } = useAuth();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ main: true, tools: false, system: false });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const NavSection = ({ title, items, sectionKey }: { title: string; items: typeof mainNav; sectionKey: string }) => (
    <div className="nav-section">
      <div 
        className="nav-label clickable" 
        onClick={() => toggleSection(sectionKey)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>{title}</span>
        <span style={{ transform: openSections[sectionKey] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '8px' }}>▶</span>
      </div>
      {openSections[sectionKey] && items.map((item, i) => (
        <NavLink 
          key={i} 
          to={item.path} 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-text">{item.text}</span>
          {item.badge && <span className="nav-badge">{item.badge}</span>}
        </NavLink>
      ))}
    </div>
  );

  return (
    <aside className="sidebar">
      <nav className="side-nav">
        <NavSection title="MAIN" items={mainNav} sectionKey="main" />
        <NavSection title="TOOLS" items={toolsNav} sectionKey="tools" />
        <NavSection title="SYSTEM" items={systemNav} sectionKey="system" />
      </nav>
      <div className="side-bottom">
        <div className="mcp-status">
          <div className="mcp-row">
            <div className="mcp-dot live"></div>
            <span>2 servers active</span>
          </div>
          <div className="mcp-row">
            <div className="mcp-dot"></div>
            <span>1 server offline</span>
          </div>
        </div>
        
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px solid var(--c4)' }}>
          {authenticated && user ? (
            <div className="user-profile">
              <div className="user-avatar">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <span className="user-email">{user.email}</span>
                <button onClick={handleLogout} className="logout-btn">Sign out</button>
              </div>
            </div>
          ) : (
            <NavLink to="/login" className="nav-item" style={{ justifyContent: 'center' }}>
              <span className="nav-icon">🔑</span>
              <span className="nav-text">Sign In</span>
            </NavLink>
          )}
        </div>
        
        <div style={{ marginTop: '12px' }}>
          <NavLink to="/" className="nav-item landing-link">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Landing Page</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}