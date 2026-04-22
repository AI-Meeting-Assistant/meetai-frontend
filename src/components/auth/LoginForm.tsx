import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(email, password);
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
      <button type="submit" className="btn-primary auth-submit">
        Login
      </button>
    </form>
  );
}
