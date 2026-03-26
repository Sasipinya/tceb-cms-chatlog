'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2, Plus, Pencil, Trash2, Check, X, Shield, Key, Globe } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type UserRole = 'pending' | 'viewer' | 'analyst' | 'editor' | 'admin';

interface CmsUser {
  _id:          string;
  email:        string;
  name?:        string;
  role:         UserRole;
  provider:     'microsoft' | 'local';
  approved:     boolean;
  approved_by?: string;
  last_login?:  string;
  createdAt:    string;
}

const ROLES: UserRole[] = ['pending', 'viewer', 'analyst', 'editor', 'admin'];

const roleColor: Record<UserRole, string> = {
  pending: '#d97706', viewer: '#0284c7', analyst: '#7c3aed', editor: '#059669', admin: '#e11d48',
};

const roleStyle = (role: UserRole): React.CSSProperties => ({
  background: roleColor[role] + '18', color: roleColor[role],
  border: `1px solid ${roleColor[role]}40`,
  padding: '3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 600, display: 'inline-block',
});

export default function UserManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users,    setUsers]    = useState<CmsUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('viewer');
  const [saving,   setSaving]   = useState(false);
  const [showAdd,  setShowAdd]  = useState(false);
  const [newEmail,    setNewEmail]    = useState('');
  const [newName,     setNewName]     = useState('');
  const [newRole,     setNewRole]     = useState<UserRole>('viewer');
  const [newPassword, setNewPassword] = useState('');
  const [isLocal,     setIsLocal]     = useState(false);
  const [adding,   setAdding]   = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (session && (session.user as any)?.role !== 'admin') router.replace('/dashboard');
  }, [session, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/users');
      setUsers(Array.isArray(await res.json()) ? await res.clone().json() : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function saveRole(id: string) {
    setSaving(true);
    await fetch(`/api/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: editRole }),
    });
    setEditId(null);
    await fetchUsers();
    setSaving(false);
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`ลบ ${email}?`)) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  }

  async function addUser() {
    if (!newEmail.trim()) return;
    setAdding(true); setError('');
    const body: any = { email: newEmail.trim(), name: newName.trim() || newEmail.trim(), role: newRole };
    if (isLocal) body.password = newPassword;

    const res = await fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowAdd(false); setNewEmail(''); setNewName(''); setNewPassword(''); setNewRole('viewer'); setIsLocal(false);
      fetchUsers();
    } else {
      setError((await res.json()).error ?? 'เกิดข้อผิดพลาด');
    }
    setAdding(false);
  }

  const pending = users.filter((u) => u.role === 'pending');
  const active  = users.filter((u) => u.role !== 'pending');
  const panel: React.CSSProperties = { background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16 };

  return (
    <AppShell>
      <div className="space-y-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>User Management</h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 2 }}>{users.length} users ทั้งหมด</p>
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> เพิ่ม User
          </button>
        </div>

        {/* Add user form */}
        {showAdd && (
          <div style={panel}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>เพิ่ม User ใหม่</p>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Provider toggle */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setIsLocal(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  border: !isLocal ? '1px solid rgba(6,182,212,0.4)' : '1px solid var(--border)',
                  background: !isLocal ? 'var(--grad-cyan)' : 'var(--surface-2)',
                  color: !isLocal ? '#fff' : 'var(--text-muted)',
                }}>
                  <Globe style={{ width: 16, height: 16 }} /> Microsoft
                </button>
                <button onClick={() => setIsLocal(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  border: isLocal ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--border)',
                  background: isLocal ? 'var(--grad-violet)' : 'var(--surface-2)',
                  color: isLocal ? '#fff' : 'var(--text-muted)',
                }}>
                  <Key style={{ width: 16, height: 16 }} /> Username/Password
                </button>
              </div>

              {/* Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email *</label>
                  <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" className="input-dark" />
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>ชื่อ</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ชื่อ-นามสกุล" className="input-dark" />
                </div>
              </div>

              {/* Password (local only) */}
              {isLocal && (
                <div>
                  <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Password * <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(อย่างน้อย 6 ตัวอักษร)</span>
                  </label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="input-dark" />
                </div>
              )}

              {/* Role */}
              <div>
                <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Role</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ROLES.filter((r) => r !== 'pending').map((r) => (
                    <button key={r} onClick={() => setNewRole(r)} style={{
                      padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      border: newRole === r ? `1px solid ${roleColor[r]}60` : '1px solid var(--border)',
                      background: newRole === r ? roleColor[r] + '20' : 'var(--surface-2)',
                      color: newRole === r ? roleColor[r] : 'var(--text-muted)',
                    }}>{r}</button>
                  ))}
                </div>
              </div>

              {error && <p style={{ fontSize: 14, color: 'var(--rose)' }}>{error}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" onClick={addUser}
                  disabled={adding || !newEmail.trim() || (isLocal && newPassword.length < 6)}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  บันทึก
                </button>
                <button className="btn-ghost" onClick={() => { setShowAdd(false); setError(''); }}>
                  <X className="h-4 w-4" /> ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div style={panel}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#d97706' }}>รออนุมัติ ({pending.length})</p>
            </div>
            <table className="data-table">
              <thead><tr>
                <th>Email</th><th>ชื่อ</th><th>สมัครเมื่อ</th><th style={{ textAlign: 'center' }}>อนุมัติ Role</th>
              </tr></thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.email}</td>
                    <td>{u.name ?? '—'}</td>
                    <td style={{ fontSize: 14 }}>{new Date(u.createdAt).toLocaleDateString('th-TH')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {ROLES.filter((r) => r !== 'pending').map((r) => (
                          <button key={r} onClick={async () => {
                            await fetch(`/api/users/${u._id}`, {
                              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ role: r }),
                            });
                            fetchUsers();
                          }} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: roleColor[r] + '15', border: `1px solid ${roleColor[r]}40`, color: roleColor[r] }}>
                            {r}
                          </button>
                        ))}
                        <button onClick={() => deleteUser(u._id, u.email)} style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#e11d48', cursor: 'pointer' }}>
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Active users */}
        <div style={panel}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield style={{ width: 18, height: 18, color: 'var(--cyan)' }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Users ทั้งหมด ({active.length})</p>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--cyan)' }} />
            </div>
          ) : (
            <table className="data-table">
              <thead><tr>
                <th>Email</th><th>ชื่อ</th><th>Provider</th><th>Role</th><th>เข้าล่าสุด</th><th style={{ textAlign: 'center' }}>Action</th>
              </tr></thead>
              <tbody>
                {active.map((u) => (
                  <tr key={u._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.email}</td>
                    <td>{u.name ?? '—'}</td>
                    <td>
                      {u.provider === 'local'
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', padding: '2px 8px', borderRadius: 999 }}><Key style={{ width: 11, height: 11 }} />Local</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#0284c7', background: 'rgba(2,132,199,0.1)', border: '1px solid rgba(2,132,199,0.25)', padding: '2px 8px', borderRadius: 999 }}><Globe style={{ width: 11, height: 11 }} />Microsoft</span>}
                    </td>
                    <td>
                      {editId === u._id
                        ? <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="input-dark" style={{ width: 120, padding: '6px 10px', fontSize: 14 }}>
                            {ROLES.filter((r) => r !== 'pending').map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        : <span style={roleStyle(u.role)}>{u.role}</span>}
                    </td>
                    <td style={{ fontSize: 14 }}>{u.last_login ? new Date(u.last_login).toLocaleDateString('th-TH') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {editId === u._id ? (
                          <>
                            <button onClick={() => saveRole(u._id)} disabled={saving} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--grad-cyan)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {saving ? <Loader2 style={{ width: 14, height: 14, color: '#fff' }} /> : <Check style={{ width: 14, height: 14, color: '#fff' }} />}
                            </button>
                            <button onClick={() => setEditId(null)} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                              <X style={{ width: 14, height: 14 }} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditId(u._id); setEditRole(u.role); }} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                              <Pencil style={{ width: 14, height: 14 }} />
                            </button>
                            <button onClick={() => deleteUser(u._id, u.email)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {active.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>ยังไม่มี users</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}