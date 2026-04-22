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
    <main>
      <h1>Register</h1>
      <RegisterForm onSubmit={handleSubmit} />
      <Link to="/login">Already have an account?</Link>
    </main>
  );
}
