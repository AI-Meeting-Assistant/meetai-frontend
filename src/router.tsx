import type { ReactNode } from 'react';
import { Navigate, Outlet, createHashRouter } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LiveDashboardPage } from './pages/LiveDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MeetingAnalysisPage } from './pages/MeetingAnalysisPage';
import { MeetingListPage } from './pages/MeetingListPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';

function PrivateRoute({ children }: { children?: ReactNode }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

function ModeratorRoute({ children }: { children?: ReactNode }) {
  const { token, user } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
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
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <PrivateRoute />,
    children: [
      { path: '/meetings', element: <MeetingListPage /> },
      { path: '/meetings/:id/analysis', element: <MeetingAnalysisPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  {
    element: <ModeratorRoute />,
    children: [{ path: '/meetings/:id/live', element: <LiveDashboardPage /> }],
  },
]);
