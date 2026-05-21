import { useNavigate, Link } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { AppLogo } from '../components/common/AppHeader';
import { SunIcon, MoonIcon } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleSubmit = async (email: string, password: string) => {
    await login(email, password);
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
            <h1>Sign in</h1>
            <p>Use the credentials provided by your organization.</p>
          </div>

          <LoginForm onSubmit={handleSubmit} submitLabel="Sign in" />

          <div className="auth-link">
            New organization?{' '}
            <Link to="/register">Register here</Link>
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
