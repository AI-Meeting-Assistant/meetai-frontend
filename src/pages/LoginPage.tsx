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
        <h1 className="auth-title">Welcome back</h1>
        <LoginForm onSubmit={handleSubmit} />
        <p className="auth-link">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
