import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  submitLabel?: string;
}

export function LoginForm({ onSubmit, submitLabel = 'Sign in' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        void onSubmit(email, password)
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : 'Sign in failed');
          })
          .finally(() => setSubmitting(false));
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label htmlFor="login-email" style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>
          Email
        </label>
        <input
          id="login-email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label htmlFor="login-password" style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={submitting}
        style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', marginTop: 6 }}
      >
        {submitting ? 'Signing in…' : submitLabel}
      </button>
    </form>
  );
}
