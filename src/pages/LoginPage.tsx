import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    await login(email, password);
    navigate('/meetings');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 'var(--space-4)' }}>
          Use the email and password provided by your organization.
        </p>
        <LoginForm onSubmit={handleSubmit} submitLabel="Sign in" />
        <p className="auth-link">
          New organization? <Link to="/register">Register your organization</Link>
        </p>
      </div>
    </div>
  );
}
