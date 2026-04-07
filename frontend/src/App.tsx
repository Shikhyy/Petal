import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { LoginPage } from './pages/LoginPage';
import { MCPPage } from './pages/MCPPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import DashboardPage from './pages/DashboardPage';
import { ActivityPage } from './pages/ActivityPage';
import { ProfilePage } from './pages/ProfilePage';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import SignUpPage from './pages/SignUpPage';
import './styles/brutalist.css';
import './styles/landing.css';

function AppLayout() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <main className="main">
      <div className={`page ${path === '/app' || path === '/app/' ? 'active' : ''}`}>
        <ChatPage />
      </div>
      <div className={`page ${path === '/app/dashboard' ? 'active' : ''}`}>
        <DashboardPage />
      </div>
      <div className={`page ${path === '/app/tasks' ? 'active' : ''}`}>
        <TasksPage />
      </div>
      <div className={`page ${path === '/app/calendar' ? 'active' : ''}`}>
        <CalendarPage />
      </div>
      <div className={`page ${path === '/app/knowledge' ? 'active' : ''}`}>
        <KnowledgePage />
      </div>
      <div className={`page ${path === '/app/mcp' ? 'active' : ''}`}>
        <MCPPage />
      </div>
      <div className={`page ${path === '/app/connections' ? 'active' : ''}`}>
        <ConnectionsPage />
      </div>
      <div className={`page ${path === '/app/settings' ? 'active' : ''}`}>
        <SettingsPage />
      </div>
      <div className={`page ${path === '/app/help' ? 'active' : ''}`}>
        <HelpPage />
      </div>
      <div className={`page ${path === '/app/activity' ? 'active' : ''}`}>
        <ActivityPage />
      </div>
      <div className={`page ${path === '/app/profile' ? 'active' : ''}`}>
        <ProfilePage />
      </div>
      <div className={`page ${path === '/app/agents' ? 'active' : ''}`}>
        <ChatPage />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app/*" element={
          <div className="app">
            <Topbar />
            <Sidebar />
            <AppLayout />
            <CommandPalette />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}