import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Suspense, lazy, type ReactNode } from 'react';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import { useAuth } from './hooks/useAuth';
import './styles/brutalist.css';
import './styles/brutalist-a11y.css';
import './styles/brutalist-responsive.css';
import './styles/landing.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const DiagnosticsPage = lazy(() => import('./pages/DiagnosticsPage'));

const ChatPage = lazy(() => import('./pages/ChatPage').then((mod) => ({ default: mod.ChatPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then((mod) => ({ default: mod.TasksPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((mod) => ({ default: mod.CalendarPage })));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage').then((mod) => ({ default: mod.KnowledgePage })));
const MCPPage = lazy(() => import('./pages/MCPPage').then((mod) => ({ default: mod.MCPPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((mod) => ({ default: mod.SettingsPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then((mod) => ({ default: mod.HelpPage })));
const ActivityPage = lazy(() => import('./pages/ActivityPage').then((mod) => ({ default: mod.ActivityPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((mod) => ({ default: mod.ProfilePage })));

const LoadingPage = () => (
  <div className="auth-shell">
    <section className="auth-panel">
      <div className="auth-card">Loading...</div>
    </section>
  </div>
);

const RoutedPage = ({ children }: { children: ReactNode }) => (
  <div className="page active">{children}</div>
);

function RequireAuth({ children }: { children: ReactNode }) {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  if (!authenticated) {
    return <Navigate to="/signup?mode=login" replace />;
  }

  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { authenticated, loading } = useAuth();

  if (loading) return <LoadingPage />;
  if (authenticated) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppLayoutShell() {
  return (
    <div className="app">
      <Topbar />
      <Sidebar />
      <main className="main">
        <Suspense fallback={<LoadingPage />}>
          <Outlet />
        </Suspense>
      </main>
      <CommandPalette />
    </div>
  );
}

function PublicPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingPage />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicPage><LandingPage /></PublicPage>} />
        <Route path="/features" element={<PublicPage><FeaturesPage /></PublicPage>} />
        <Route path="/how-it-works" element={<PublicPage><HowItWorksPage /></PublicPage>} />
        <Route path="/signup" element={<PublicOnly><PublicPage><SignUpPage /></PublicPage></PublicOnly>} />
        <Route path="/login" element={<Navigate to="/signup?mode=login" replace />} />

        <Route path="/app" element={
          <RequireAuth>
            <AppLayoutShell />
          </RequireAuth>
        }>
          <Route index element={<RoutedPage><ChatPage /></RoutedPage>} />
          <Route path="dashboard" element={<RoutedPage><DashboardPage /></RoutedPage>} />
          <Route path="tasks" element={<RoutedPage><TasksPage /></RoutedPage>} />
          <Route path="calendar" element={<RoutedPage><CalendarPage /></RoutedPage>} />
          <Route path="knowledge" element={<RoutedPage><KnowledgePage /></RoutedPage>} />
          <Route path="mcp" element={<RoutedPage><MCPPage /></RoutedPage>} />
          <Route path="settings" element={<RoutedPage><SettingsPage /></RoutedPage>} />
          <Route path="help" element={<RoutedPage><HelpPage /></RoutedPage>} />
          <Route path="activity" element={<RoutedPage><ActivityPage /></RoutedPage>} />
          <Route path="profile" element={<RoutedPage><ProfilePage /></RoutedPage>} />
          <Route path="agents" element={<RoutedPage><AgentsPage /></RoutedPage>} />
          <Route path="diagnostics" element={<RoutedPage><DiagnosticsPage /></RoutedPage>} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}