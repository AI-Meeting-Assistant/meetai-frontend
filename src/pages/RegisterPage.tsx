import { useNavigate, Link } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import { AppLogo } from '../components/common/AppHeader';
import { SunIcon, MoonIcon } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import type { RegisterPayload } from '../services/auth.service';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleSubmit = async (payload: RegisterPayload) => {
    await register(payload);
    navigate('/meetings');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
          <AppLogo />
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px 36px' }}>
          <div className="auth-title">
            <h1>Register organization</h1>
            <p>
              Creates your organization and an administrator account. Add team
              members from Settings after sign-in.
            </p>
          </div>

          <RegisterForm onSubmit={handleSubmit} />

          <div className="auth-link">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </div>
        </div>

        <div className="auth-theme-toggle">
          <button type="button" onClick={toggleDarkMode}>
            {darkMode ? <SunIcon /> : <MoonIcon />}
            {darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          </button>
        </div>
      </div>
    </div>
  );
}
