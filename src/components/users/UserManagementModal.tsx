import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as userService from '../../services/user.service';
import type { OrganizationUser } from '../../services/user.service';
import type { UserRole } from '../../types';

interface UserManagementModalProps {
  onClose: () => void;
}

export function UserManagementModal({ onClose }: UserManagementModalProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.listUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      await userService.createUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('VIEWER');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: OrganizationUser) => {
    setError(null);
    try {
      await userService.setUserActive(user.id, !user.isActive);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, width: '100%' }}
      >
        <div className="modal-header">
          <h3>Team members</h3>
        </div>

        <form onSubmit={(e) => void handleCreate(e)} style={{ marginBottom: 'var(--space-4)' }}>
          <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Add a member to your organization. They sign in with the shared sign-in page.
          </p>
          <div className="form-group">
            <label htmlFor="member-name">Full name</label>
            <input
              id="member-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="member-email">Email</label>
            <input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="member-password">Password</label>
            <input
              id="member-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="member-role">Role</label>
            <select
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="MODERATOR">Moderator</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add member'}
          </button>
        </form>

        {error && (
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</p>
        )}

        {loading ? (
          <p className="empty-state">Loading team members…</p>
        ) : users.length === 0 ? (
          <p className="empty-state">No team members yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-2)' }}>Name</th>
                  <th style={{ padding: 'var(--space-2)' }}>Email</th>
                  <th style={{ padding: 'var(--space-2)' }}>Role</th>
                  <th style={{ padding: 'var(--space-2)' }}>Status</th>
                  <th style={{ padding: 'var(--space-2)' }} />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-2)' }}>{u.fullName}</td>
                    <td style={{ padding: 'var(--space-2)' }}>{u.email}</td>
                    <td style={{ padding: 'var(--space-2)' }}>{u.role === 'MODERATOR' ? 'Moderator' : 'Viewer'}</td>
                    <td style={{ padding: 'var(--space-2)' }}>{u.isActive ? 'Active' : 'Inactive'}</td>
                    <td style={{ padding: 'var(--space-2)' }}>
                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => void handleToggleActive(u)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-footer" style={{ marginTop: 'var(--space-4)' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
