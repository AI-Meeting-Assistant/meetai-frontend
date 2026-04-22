import { useState } from 'react';
import type { RegisterPayload } from '../../services/auth.service';

interface RegisterFormProps {
  onSubmit: (payload: RegisterPayload) => Promise<void>;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({ fullName, email, password });
      }}
    >
      <input placeholder="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
      <input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button type="submit">Register</button>
    </form>
  );
}
