import { useState } from 'react';
import type { RegisterPayload } from '../../services/auth.service';

interface RegisterFormProps {
  onSubmit: (payload: RegisterPayload) => Promise<void>;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({ fullName, email, password, organizationName });
      }}
    >
      <div className="form-group">
        <label htmlFor="reg-name">Full Name</label>
        <input
          id="reg-name"
          type="text"
          placeholder="Jane Doe"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="reg-email">Email</label>
        <input
          id="reg-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="reg-org">Organization</label>
        <input
          id="reg-org"
          type="text"
          placeholder="Acme Corp"
          value={organizationName}
          onChange={(event) => setOrganizationName(event.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="reg-password">Password</label>
        <input
          id="reg-password"
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary auth-submit">
        Create Account
      </button>
    </form>
  );
}
