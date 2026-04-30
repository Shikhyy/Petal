import { useMemo, useState, type ComponentProps } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useNotes } from '../hooks/useNotes';
import { useAgents } from '../hooks/useAgents';
import { AppIcon } from './AppIcon';

type NavItem = {
  icon: ComponentProps<typeof AppIcon>['name'];
  text: string;
  path: string;
  badge?: string;
};

const systemNav: NavItem[] = [
  { icon: 'settings', text: 'Settings', path: '/app/settings', badge: '' },
  { icon: 'profile', text: 'Profile', path: '/app/profile', badge: '' },
  { icon: 'diagnostics', text: 'Diagnostics', path: '/app/diagnostics', badge: '' },
  { icon: 'help', text: 'Help', path: '/app/help', badge: '' },
];

export function Sidebar() {
  const { user, logout, authenticated } = useAuth();
  const { tasks } = useTasks();
  const { notes } = useNotes();
  const { agents } = useAgents();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ main: true, tools: false, system: false });

  const mainNav: NavItem[] = useMemo(() => [
    { icon: 'dashboard', text: 'Dashboard', path: '/app/dashboard' },
    { icon: 'chat', text: 'Chat', path: '/app' },
    { icon: 'task', text: 'Tasks', path: '/app/tasks', badge: String(tasks.length) },
    { icon: 'calendar', text: 'Calendar', path: '/app/calendar' },
    { icon: 'note', text: 'Knowledge', path: '/app/knowledge', badge: String(notes.length) },
  ], [tasks.length, notes.length]);

  const toolsNav: NavItem[] = useMemo(() => [
    { icon: 'agents', text: 'Agents', path: '/app/agents', badge: String(agents.length) },
    { icon: 'mcp', text: 'MCP Servers', path: '/app/mcp' },
    { icon: 'activity', text: 'Activity', path: '/app/activity' },
  ], [agents.length]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const NavSection = ({ title, items, sectionKey }: { title: string; items: NavItem[]; sectionKey: string }) => (
    <div className="nav-section">
      <button
        type="button"
        className="nav-label nav-label-btn"
        onClick={() => toggleSection(sectionKey)}
        aria-expanded={openSections[sectionKey]}
      >
        <span>{title}</span>
        <span className={`nav-chevron ${openSections[sectionKey] ? 'open' : ''}`}>▶</span>
      </button>
      {openSections[sectionKey] && items.map((item, i) => (
        <NavLink 
          key={i} 
          to={item.path} 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon"><AppIcon name={item.icon} size={16} /></span>
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
            <span>MCP status live</span>
          </div>
          <div className="mcp-row">
            <div className="mcp-dot"></div>
            <span>Open Diagnostics for backend health</span>
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
            <NavLink to="/login" className="nav-item nav-item-center">
              <span className="nav-icon"><AppIcon name="search" size={16} /></span>
              <span className="nav-text">Sign In</span>
            </NavLink>
          )}
        </div>
        
        <div style={{ marginTop: '12px' }}>
          <NavLink to="/" className="nav-item landing-link">
            <span className="nav-icon"><AppIcon name="home" size={16} /></span>
            <span className="nav-text">Landing Page</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}