import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  submitLabel?: string;
}

export function LoginForm({ onSubmit, submitLabel = 'Login' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        void onSubmit(email, password)
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : 'Login failed');
          })
          .finally(() => setSubmitting(false));
      }}
    >
      <div className="form-group">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error && (
        <p className="form-error" style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
        {submitting ? 'Signing in…' : submitLabel}
      </button>
    </form>
  );
}
