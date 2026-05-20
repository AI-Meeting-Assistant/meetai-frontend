import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

export function ModeratorLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    await login(email, password, 'MODERATOR');
    navigate('/meetings');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Moderator sign in</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 'var(--space-4)' }}>
          Manage meetings, live sessions, and viewers.
        </p>
        <LoginForm onSubmit={handleSubmit} submitLabel="Sign in as moderator" />
        <p className="auth-link">
          No account? <Link to="/register">Create organization</Link>
        </p>
        <p className="auth-link">
          Viewer? <Link to="/viewer/login">Viewer sign in</Link>
        </p>
      </div>
    </div>
  );
}
