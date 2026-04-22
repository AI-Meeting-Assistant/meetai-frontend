import { Link, useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import type { RegisterPayload } from '../services/auth.service';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (payload: RegisterPayload) => {
    await register(payload);
    navigate('/meetings');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <RegisterForm onSubmit={handleSubmit} />
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
