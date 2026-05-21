import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as userService from '../../services/user.service';
import type { OrganizationUser } from '../../services/user.service';
import type { UserRole } from '../../types';
import { SlideOver } from '../common/SlideOver';

interface UserManagementModalProps {
  open: boolean;
  onClose: () => void;
}

const ROLE_COLORS: Record<UserRole, { bg: string; color: string }> = {
  MODERATOR: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  VIEWER:    { bg: 'var(--bg-subtle)',     color: 'var(--tx-2)'   },
};

export function UserManagementModal({ open, onClose }: UserManagementModalProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers]         = useState<OrganizationUser[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState<UserRole>('VIEWER');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setUsers(await userService.listUsers()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load team members'); }
    finally { setLoading(false); }
  }, []);

  // Load users and reset add-member form each time the panel opens
  useEffect(() => {
    if (open) {
      setFullName(''); setEmail(''); setPassword(''); setRole('VIEWER');
      setError(null);
      void loadUsers();
    }
  }, [open, loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      await userService.createUser({ fullName: fullName.trim(), email: email.trim(), password, role });
      setFullName(''); setEmail(''); setPassword(''); setRole('VIEWER');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (u: OrganizationUser) => {
    setError(null);
    try { await userService.setUserActive(u.id, !u.isActive); await loadUsers(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to update member'); }
  };

  return (
    <SlideOver open={open} onClose={onClose} title="Team members" width={500}>
      {/* Add member section */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
          Add member
        </div>
        <form id="add-member-form" onSubmit={(e) => void handleCreate(e)}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { id: 'mb-name',     label: 'Full name', type: 'text',     placeholder: 'Jane Doe',         value: fullName,  set: setFullName },
            { id: 'mb-email',    label: 'Email',     type: 'email',    placeholder: 'jane@company.com', value: email,     set: setEmail },
            { id: 'mb-password', label: 'Password',  type: 'password', placeholder: '••••••••',         value: password,  set: setPassword },
          ].map(({ id, label, type, placeholder, value, set }) => (
            <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor={id} style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>{label}</label>
              <input id={id} type={type} placeholder={placeholder} value={value}
                onChange={e => set(e.target.value)} required minLength={id === 'mb-password' ? 6 : undefined} />
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label htmlFor="mb-role" style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>Role</label>
            <select id="mb-role" value={role} onChange={e => setRole(e.target.value as UserRole)}>
              <option value="VIEWER">Viewer — read-only access</option>
              <option value="MODERATOR">Moderator — can create &amp; run meetings</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
            {submitting ? 'Adding…' : 'Add member'}
          </button>
        </form>
      </div>

      {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: '0 0 16px' }}>{error}</p>}

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', marginBottom: 20 }} />

      {/* Members list */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          Team <span style={{ fontWeight: 400, color: 'var(--tx-3)' }}>({users.length})</span>
        </div>

        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--tx-3)', fontStyle: 'italic' }}>Loading…</p>
        ) : users.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--tx-3)', fontStyle: 'italic' }}>No team members yet.</p>
        ) : (
          <div>
            {users.map((u, i) => {
              const rc = ROLE_COLORS[u.role] ?? ROLE_COLORS.VIEWER;
              return (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < users.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'var(--accent-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                  }}>
                    {u.fullName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: u.isActive ? 'var(--tx-1)' : 'var(--tx-3)' }}>
                      {u.fullName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tx-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: '2px 7px',
                    borderRadius: 'var(--r-sm)', background: rc.bg, color: rc.color,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {u.role === 'MODERATOR' ? 'Moderator' : 'Viewer'}
                  </span>
                  {u.id !== currentUser?.id && (
                    <button type="button" className="btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }}
                      onClick={() => void handleToggleActive(u)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SlideOver>
  );
}
