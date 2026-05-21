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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        void onSubmit({ fullName, email, password, organizationName })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : 'Registration failed');
          })
          .finally(() => setSubmitting(false));
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {[
        { id: 'reg-name',     label: 'Full name',          type: 'text',     placeholder: 'Jane Doe',       value: fullName,         set: setFullName },
        { id: 'reg-email',    label: 'Email',               type: 'email',    placeholder: 'you@company.com',value: email,            set: setEmail },
        { id: 'reg-org',      label: 'Organization name',   type: 'text',     placeholder: 'Acme Corp',      value: organizationName, set: setOrganizationName },
        { id: 'reg-password', label: 'Password',            type: 'password', placeholder: '••••••••',       value: password,         set: setPassword },
      ].map(({ id, label, type, placeholder, value, set }) => (
        <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label htmlFor={id} style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>
            {label}
          </label>
          <input
            id={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      ))}

      {error && (
        <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={submitting}
        style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', marginTop: 6 }}
      >
        {submitting ? 'Registering…' : 'Register organization'}
      </button>
    </form>
  );
}
