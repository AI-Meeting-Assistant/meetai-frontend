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
    <main>
      <h1>Login</h1>
      <LoginForm onSubmit={handleSubmit} />
      <Link to="/register">Create account</Link>
    </main>
  );
}
