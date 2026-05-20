import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

export function ViewerLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    await login(email, password, 'VIEWER');
    navigate('/meetings');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Viewer sign in</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 'var(--space-4)' }}>
          View meeting results for your organization. Accounts are created by a moderator.
        </p>
        <LoginForm onSubmit={handleSubmit} submitLabel="Sign in as viewer" />
        <p className="auth-link">
          Moderator? <Link to="/login">Moderator sign in</Link>
        </p>
      </div>
    </div>
  );
}
