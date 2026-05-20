import type { ReactNode } from 'react';
import { Navigate, Outlet, createHashRouter, useLocation } from 'react-router-dom';
import { AppHeader } from './components/common/AppHeader';
import { useAuth } from './contexts/AuthContext';
import { LiveDashboardPage } from './pages/LiveDashboardPage';
import { ModeratorLoginPage } from './pages/ModeratorLoginPage';
import { MeetingAnalysisPage } from './pages/MeetingAnalysisPage';
import { MeetingListPage } from './pages/MeetingListPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { ViewerLoginPage } from './pages/ViewerLoginPage';

function AuthenticatedLayout() {
  return (
    <div className="app-layout">
      <AppHeader />
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}

function getLoginPath(pathname: string): string {
  return pathname.startsWith('/viewer') ? '/viewer/login' : '/login';
}

function PrivateRoute({ children }: { children?: ReactNode }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) {
    return <Navigate to={getLoginPath(location.pathname)} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

function ModeratorRoute({ children }: { children?: ReactNode }) {
  const { token, user } = useAuth();
  const location = useLocation();
  if (!token) {
    return <Navigate to={getLoginPath(location.pathname)} replace />;
  }
  if (user?.role !== 'MODERATOR') {
    return <Navigate to="/meetings" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

function RootRedirect() {
  const { token } = useAuth();
  return <Navigate to={token ? '/meetings' : '/login'} replace />;
}

export const router = createHashRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <ModeratorLoginPage /> },
  { path: '/viewer/login', element: <ViewerLoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: (
      <PrivateRoute>
        <AuthenticatedLayout />
      </PrivateRoute>
    ),
    children: [
      { path: '/meetings', element: <MeetingListPage /> },
      { path: '/meetings/:id/analysis', element: <MeetingAnalysisPage /> },
      {
        element: <ModeratorRoute />,
        children: [
          { path: '/meetings/:id/live', element: <LiveDashboardPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
